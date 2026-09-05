"""
server/app/routes/animals.py
Animal herd management, AI verification status tracking, and Pashu Aadhaar records.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from server.app.schemas.schemas import (
    AnimalCreate,
    AnimalUpdate,
    AnimalResponse,
    AnimalVerifyPayload
)
from server.app.services.auth.auth_service import get_current_user_optional, get_current_user
from server.app.database.database import (
    get_animals,
    get_animal_by_id,
    create_animal,
    update_animal,
    delete_animal
)

router = APIRouter(prefix="/api/animals", tags=["Animals & Herd Management"])

@router.get("", response_model=List[AnimalResponse])
def list_animals(
    animal_type: Optional[str] = Query(None, description="Cattle, Buffalo, or All"),
    breed: Optional[str] = Query(None, description="Filter by breed"),
    verified_only: bool = Query(False, description="Show only verified animals"),
    for_sale_only: bool = Query(False, description="Show only animals marked for sale"),
    search: Optional[str] = Query(None, description="Search by animal ID or breed"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    List animals. If logged in as Farmer, returns the farmer's herd.
    If Middleman or Admin, allows searching across verified livestock.
    """
    owner_filter = None
    if current_user and current_user.get("role") == "FARMER":
        owner_filter = current_user.get("sub")

    animals = get_animals(
        owner_id=owner_filter,
        animal_type=animal_type,
        breed=breed,
        verified_only=verified_only,
        for_sale_only=for_sale_only,
        search=search
    )
    return [AnimalResponse(**a) for a in animals]

@router.post("", response_model=AnimalResponse)
def add_animal(
    payload: AnimalCreate,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Creates a new animal in the herd linked to the authenticated farmer.
    Seamlessly preserves AI prediction vs Human verified breed distinction.
    """
    owner_id = current_user.get("sub", 1) if current_user else 1

    identifier = payload.animal_identifier or payload.tag_number or "PB-GEN-01"
    sp = payload.animal_type or payload.species or "Cattle"
    p_breed = payload.predicted_breed or payload.breed or "Gir"
    p_conf = payload.predicted_confidence if payload.predicted_confidence is not None else (payload.confidence_score if payload.confidence_score is not None else 0.85)
    v_breed = payload.verified_breed or payload.breed or p_breed
    milk_prod = payload.milk_production if payload.milk_production is not None else (payload.daily_milk_yield_litres or 12.0)

    try:
        record = create_animal(
            owner_id=owner_id,
            animal_identifier=identifier,
            animal_type=sp,
            predicted_breed=p_breed,
            predicted_confidence=p_conf,
            verified_breed=v_breed,
            verification_status=payload.verification_status or "Human Verified",
            breed=v_breed,
            pashu_aadhaar=payload.pashu_aadhaar,
            sex=payload.sex or "Female",
            age=payload.age or (payload.age_months // 12 if payload.age_months else 3),
            color=payload.color or "Reddish brown",
            weight=payload.weight or 380.0,
            milk_production=milk_prod,
            pregnancy_status=payload.pregnancy_status or "Not pregnant",
            vaccination_status=payload.vaccination_status or "FMD Vaccinated",
            for_sale=payload.for_sale or (payload.status == "FOR_SALE"),
            notes=payload.notes,
            photo_url=payload.photo_url or "/api/sample/Gir",
            latitude=payload.latitude or 22.5645,
            longitude=payload.longitude or 72.9289,
            model_version=payload.model_version or "efficientnet_b0-41c-2026-09-05"
        )
        return AnimalResponse(**record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register animal: {str(e)}")

@router.get("/{animal_id}", response_model=AnimalResponse)
def get_animal(animal_id: int):
    """Retrieve animal profile by ID."""
    animal = get_animal_by_id(animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail=f"Animal #{animal_id} not found.")
    return AnimalResponse(**animal)

@router.put("/{animal_id}", response_model=AnimalResponse)
def update_animal_details(
    animal_id: int,
    payload: AnimalUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update animal attributes (milk yield, health, for sale, notes)."""
    animal = get_animal_by_id(animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail=f"Animal #{animal_id} not found.")

    # Only owner or admin can update
    if current_user.get("role") != "ADMIN" and animal.get("owner_id") != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="You are not authorized to modify this animal.")

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if "for_sale" in updates:
        updates["for_sale"] = 1 if updates["for_sale"] else 0

    updated = update_animal(animal_id, updates)
    return AnimalResponse(**updated)

@router.delete("/{animal_id}")
def remove_animal(
    animal_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Deletes an animal from herd."""
    animal = get_animal_by_id(animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail=f"Animal #{animal_id} not found.")

    if current_user.get("role") != "ADMIN" and animal.get("owner_id") != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="You are not authorized to delete this animal.")

    success = delete_animal(animal_id)
    return {"status": "success", "message": f"Animal #{animal_id} deleted."}

@router.post("/{animal_id}/verify", response_model=AnimalResponse)
def verify_animal_breed(
    animal_id: int,
    payload: AnimalVerifyPayload,
    current_user: dict = Depends(get_current_user)
):
    """
    Confirms or overrides animal breed with field decision audit trail.
    """
    animal = get_animal_by_id(animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail=f"Animal #{animal_id} not found.")

    updates = {
        "verified_breed": payload.verified_breed,
        "breed": payload.verified_breed,
        "verification_status": payload.verification_status,
        "notes": payload.notes or animal.get("notes")
    }
    updated = update_animal(animal_id, updates)
    return AnimalResponse(**updated)
