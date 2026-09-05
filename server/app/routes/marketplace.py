"""
server/app/routes/marketplace.py
Marketplace listings, search, multi-faceted filtering, and middleman saved favourites.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from server.app.schemas.schemas import (
    ListingCreate,
    ListingStatusUpdate,
    ListingResponse
)
from server.app.services.auth.auth_service import get_current_user_optional, get_current_user, require_role
from server.app.database.database import (
    get_listings,
    get_listing_by_id,
    create_listing,
    update_listing_status,
    save_animal_for_user,
    remove_saved_animal,
    get_saved_animals_for_user
)

router = APIRouter(prefix="/api", tags=["Marketplace"])

@router.get("/listings", response_model=List[ListingResponse])
def list_marketplace(
    animal_type: Optional[str] = Query(None, description="Cattle, Buffalo, or All"),
    breed: Optional[str] = Query(None, description="Filter by breed"),
    district: Optional[str] = Query(None, description="Filter by district"),
    max_price: Optional[float] = Query(None, description="Maximum price in INR"),
    verified_only: bool = Query(False, description="Filter by AI + Human verified status"),
    status: str = Query("Active", description="Active, Sold, or All"),
    search: Optional[str] = Query(None, description="Search title, breed, description, district"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Search and filter livestock listings.
    Accessible to Farmers, Middlemen, and public guest visitors.
    """
    listings = get_listings(
        animal_type=animal_type,
        breed=breed,
        district=district,
        max_price=max_price,
        verified_only=verified_only,
        status=status,
        search=search
    )
    return [ListingResponse(**l) for l in listings]

@router.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: int):
    """Retrieve single marketplace listing with seller overview."""
    listing = get_listing_by_id(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail=f"Listing #{listing_id} not found.")
    return ListingResponse(**listing)

@router.post("/listings", response_model=ListingResponse)
def publish_listing(
    payload: ListingCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Publish an animal from farmer's herd for sale on the marketplace.
    """
    try:
        listing = create_listing(
            animal_id=payload.animal_id,
            seller_id=current_user["sub"],
            title=payload.title,
            price=payload.price,
            description=payload.description,
            contact_phone=payload.contact_phone,
            district=payload.district
        )
        return ListingResponse(**listing)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish listing: {str(e)}")

@router.put("/listings/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: int,
    payload: ListingStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update listing status (Active, Pending, Sold, Expired)."""
    listing = get_listing_by_id(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail=f"Listing #{listing_id} not found.")

    if current_user.get("role") != "ADMIN" and listing.get("seller_id") != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing.")

    updated = update_listing_status(listing_id, payload.status)
    return ListingResponse(**updated)

# =====================================================================
# SAVED ANIMALS (MIDDLEMAN FAVOURITES)
# =====================================================================

@router.get("/saved", response_model=List[ListingResponse])
def list_saved(current_user: dict = Depends(get_current_user)):
    """Retrieve middleman's saved/favourite livestock listings."""
    saved = get_saved_animals_for_user(current_user["sub"])
    return [ListingResponse(**s) for s in saved]

@router.post("/saved/{listing_id}")
def save_listing(
    listing_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Save an animal listing to middleman's watchlist."""
    save_animal_for_user(current_user["sub"], listing_id)
    return {"status": "success", "message": f"Listing #{listing_id} saved to favourites."}

@router.delete("/saved/{listing_id}")
def unsave_listing(
    listing_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Remove an animal listing from saved favourites."""
    remove_saved_animal(current_user["sub"], listing_id)
    return {"status": "success", "message": f"Listing #{listing_id} removed from favourites."}
