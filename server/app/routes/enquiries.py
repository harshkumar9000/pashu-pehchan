"""
server/app/routes/enquiries.py
Buyer-Seller enquiry negotiation workflows between Middlemen and Farmers.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from server.app.schemas.schemas import EnquiryCreate, EnquiryStatusUpdate, EnquiryResponse
from server.app.services.auth.auth_service import get_current_user
from server.app.database.database import (
    create_enquiry,
    get_enquiries_for_user,
    get_enquiry_by_id,
    update_enquiry_status
)

router = APIRouter(prefix="/api/enquiries", tags=["Enquiries"])

@router.get("", response_model=List[EnquiryResponse])
def list_enquiries(current_user: dict = Depends(get_current_user)):
    """
    List enquiries.
    If Farmer: returns received enquiries on farmer's livestock listings.
    If Middleman: returns sent enquiries on prospective animals.
    """
    role = current_user.get("role", "FARMER")
    enquiries = get_enquiries_for_user(current_user["sub"], role)
    return [EnquiryResponse(**e) for e in enquiries]

@router.post("", response_model=EnquiryResponse)
def submit_enquiry(
    payload: EnquiryCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Middleman sends an enquiry to the farmer regarding a specific livestock listing.
    """
    try:
        enquiry = create_enquiry(
            listing_id=payload.listing_id,
            middleman_id=current_user["sub"],
            message=payload.message
        )
        return EnquiryResponse(**enquiry)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit enquiry: {str(e)}")

@router.put("/{enquiry_id}", response_model=EnquiryResponse)
def update_enquiry(
    enquiry_id: int,
    payload: EnquiryStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update enquiry status (Accepted, Rejected, Closed) with optional response note.
    """
    enquiry = get_enquiry_by_id(enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail=f"Enquiry #{enquiry_id} not found.")

    # Authorization: Either party or admin
    user_id = current_user["sub"]
    if current_user.get("role") != "ADMIN" and user_id not in [enquiry["farmer_id"], enquiry["middleman_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized to update this enquiry.")

    status_clean = payload.status.strip()
    status_map = {
        "ACCEPTED": "Accepted",
        "REJECTED": "Rejected",
        "PENDING": "Sent",
        "CLOSED": "Closed",
        "SENT": "Sent",
        "RECEIVED": "Received"
    }
    final_status = status_map.get(status_clean.upper(), status_clean.capitalize())

    updated = update_enquiry_status(enquiry_id, final_status, payload.response_note)
    return EnquiryResponse(**updated)
