"""
server/app/routes/records.py
Endpoints for livestock verification records and real-time dashboard analytics.
All data is stored in and retrieved directly from SQLite.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from server.app.schemas.schemas import (
    RecordCreate,
    RecordResponse,
    DashboardResponse
)
from server.app.database.database import (
    save_record,
    get_records,
    get_record_by_id,
    get_dashboard_stats
)

router = APIRouter(prefix="/api", tags=["Records & Analytics"])

@router.post("/records", response_model=RecordResponse)
def create_record(payload: RecordCreate):
    """
    Save a new field worker verification record into SQLite.
    Stores whether the breed was confirmed, overridden, or flagged for manual review.
    """
    try:
        record = save_record(
            predicted_breed=payload.predicted_breed,
            predicted_confidence=payload.predicted_confidence,
            verified_breed=payload.verified_breed,
            verification_status=payload.verification_status,
            animal_identifier=payload.animal_identifier,
            animal_type=payload.animal_type or "Cattle",
            notes=payload.notes,
            model_version=payload.model_version or "efficientnet_b0-41c-2026-09-04",
            top3_data=payload.top3_data,
            inference_time_ms=payload.inference_time_ms or 0.0
        )
        return RecordResponse(**record)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save verification record: {str(e)}"
        )

@router.get("/records", response_model=List[RecordResponse])
def list_records(
    search: Optional[str] = Query(None, description="Search by animal tag, verified breed or predicted breed"),
    status: Optional[str] = Query(None, description="Filter by verification status"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    List audit records with search and status filtering.
    """
    try:
        records = get_records(search=search, status_filter=status, limit=limit, offset=offset)
        return [RecordResponse(**r) for r in records]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve audit records: {str(e)}"
        )

@router.get("/records/{record_id}", response_model=RecordResponse)
def get_record(record_id: int):
    """
    Retrieve single record by primary key ID.
    """
    record = get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Record #{record_id} not found.")
    return RecordResponse(**record)

@router.get("/dashboard/stats", response_model=DashboardResponse)
def get_stats():
    """
    Aggregates real statistics computed directly from verified records in SQLite.
    Includes verification rate, average confidence, top breeds, and species breakdown.
    """
    try:
        stats = get_dashboard_stats()
        return DashboardResponse(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute dashboard statistics: {str(e)}"
        )
