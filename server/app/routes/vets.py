"""
server/app/routes/vets.py
Veterinary service discovery endpoints ("Find a Vet" & Emergency Care).
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from server.app.schemas.schemas import VetResponse
from server.app.database.database import search_vet_services, get_vet_by_id

router = APIRouter(prefix="/api/vets", tags=["Veterinary Services"])

@router.get("", response_model=List[VetResponse])
def list_vets(
    district: Optional[str] = Query(None, description="Filter by district (e.g. Anand, Vadodara, Ahmedabad)"),
    category: Optional[str] = Query(None, description="Facility type or service category filter"),
    emergency_only: bool = Query(False, description="Filter for 24/7 emergency veterinary clinics"),
    query: Optional[str] = Query(None, description="Search clinic name, address, or treatments"),
    latitude: Optional[float] = Query(None, description="User current latitude for distance sorting"),
    longitude: Optional[float] = Query(None, description="User current longitude for distance sorting")
):
    """
    Find nearby veterinary clinics, government polyclinics, and animal health centres.
    Supports distance calculation from user geolocation or district-level fallback.
    """
    vets = search_vet_services(
        district=district,
        category=category,
        emergency_only=emergency_only,
        query=query,
        user_lat=latitude,
        user_lon=longitude
    )
    return [VetResponse(**v) for v in vets]

@router.get("/{vet_id}", response_model=VetResponse)
def get_vet(vet_id: int):
    """Retrieve veterinary clinic profile."""
    vet = get_vet_by_id(vet_id)
    if not vet:
        raise HTTPException(status_code=404, detail=f"Veterinary clinic #{vet_id} not found.")
    return VetResponse(**vet)
