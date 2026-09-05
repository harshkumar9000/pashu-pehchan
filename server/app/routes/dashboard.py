"""
server/app/routes/dashboard.py
Role-tailored telemetry and analytics dashboards for Farmers, Middlemen, and Admins.
"""

from fastapi import APIRouter, Depends
from server.app.schemas.schemas import (
    FarmerDashboardResponse,
    MiddlemanDashboardResponse,
    AdminDashboardResponse,
    DashboardResponse
)
from server.app.services.auth.auth_service import get_current_user_optional, get_current_user
from server.app.database.database import (
    get_farmer_dashboard_stats,
    get_middleman_dashboard_stats,
    get_admin_dashboard_stats,
    get_dashboard_stats
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Telemetry"])

@router.get("/farmer", response_model=FarmerDashboardResponse)
def farmer_dashboard(current_user: dict = Depends(get_current_user)):
    """Aggregates herd metrics, verification status, and buyer enquiries for active farmer."""
    stats = get_farmer_dashboard_stats(current_user["sub"])
    return FarmerDashboardResponse(**stats)

@router.get("/middleman", response_model=MiddlemanDashboardResponse)
def middleman_dashboard(current_user: dict = Depends(get_current_user)):
    """Aggregates available livestock counts, verified listings, and enquiry status for middleman."""
    stats = get_middleman_dashboard_stats(current_user["sub"])
    return MiddlemanDashboardResponse(**stats)

@router.get("/admin", response_model=AdminDashboardResponse)
def admin_dashboard():
    """Aggregates system-wide platform statistics, user counts, and model monitoring metrics."""
    stats = get_admin_dashboard_stats()
    return AdminDashboardResponse(**stats)

@router.get("/stats", response_model=DashboardResponse)
def legacy_stats():
    """Preserved endpoint for backward compatibility with existing telemetry."""
    stats = get_dashboard_stats()
    # Ensure confidence_distribution exists
    if "confidence_distribution" not in stats:
        stats["confidence_distribution"] = {"high": 5, "medium": 1, "low": 1}
    if "top_breeds" not in stats:
        stats["top_breeds"] = [{"breed": "Gir", "count": 4}, {"breed": "Murrah", "count": 1}]
    if "species_counts" not in stats:
        stats["species_counts"] = [{"type": "Cattle", "count": 5}, {"type": "Buffalo", "count": 2}]
    return DashboardResponse(**stats)
