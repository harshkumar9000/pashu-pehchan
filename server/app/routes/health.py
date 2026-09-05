"""
server/app/routes/health.py
Health check and system status endpoint for Vetra backend.
"""

from fastapi import APIRouter
from server.app.schemas.schemas import HealthResponse
from server.app.services.inference.predictor import get_inference_service

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    """
    Returns server health, model status, class count, and active compute device.
    """
    try:
        predictor = get_inference_service()
        info = predictor.get_info()
        return HealthResponse(
            status="ok",
            model_loaded=True,
            model_version=info.get("model_version", "efficientnet_b0-41c"),
            classes=info.get("classes_count", 41),
            device=info.get("device", "CPU"),
            architecture=info.get("architecture", "efficientnet_b0"),
            top1_accuracy=info.get("top1_accuracy", 86.42),
            top3_accuracy=info.get("top3_accuracy", 96.85),
            macro_f1=info.get("macro_f1", 84.90)
        )
    except Exception as e:
        return HealthResponse(
            status=f"degraded: {str(e)}",
            model_loaded=False,
            model_version="unavailable",
            classes=0,
            device="none",
            architecture="none"
        )
