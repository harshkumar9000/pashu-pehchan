"""
server/app/main.py
FastAPI application entry point for Vetra – AI-assisted livestock breed verification.
Provides RESTful APIs for real-time model inference, ICAR-NBAGR breed library,
audit record logging, and real-time dashboard analytics.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.app.database.database import init_db
from server.app.services.inference.predictor import get_inference_service
from server.app.routes import (
    health,
    auth,
    animals,
    predict,
    breeds,
    marketplace,
    enquiries,
    vets,
    dashboard,
    notifications,
    records
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan handler: initialize database and pre-warm trained PyTorch model."""
    print("[INIT] Initializing SQLite database schema and demo records...")
    init_db()
    print("[INIT] Pre-warming trained PyTorch EfficientNet-B0 model for fast inference...")
    try:
        predictor = get_inference_service()
        info = predictor.get_info()
        print(f"[READY] Inference engine ready on {info.get('device')} ({info.get('classes_count')} classes).")
    except Exception as e:
        print(f"[WARNING] Pre-warming failed: {e}")
    yield
    print("[SHUTDOWN] PashuPehchan backend service stopping.")

app = FastAPI(
    title="PashuPehchan - AI-Assisted Livestock Breed Verification Platform API",
    description=(
        "Production backend for PS-5: AI-Driven Cattle & Buffalo Breed Identification, "
        "digital livestock records, role-based portals (Farmer, Middleman, Admin), "
        "marketplace with enquiry flows, and veterinary discovery services."
    ),
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware for Web/Mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(animals.router)
app.include_router(predict.router)
app.include_router(breeds.router)
app.include_router(marketplace.router)
app.include_router(enquiries.router)
app.include_router(vets.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(records.router)

@app.get("/")
def root():
    return {
        "service": "PashuPehchan - AI-Assisted Livestock Breed Verification Platform",
        "problem_statement": "PS-5: Cattle & Buffalo Breed Identification",
        "version": "2.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/api/health",
            "auth": "/api/auth/login, /api/auth/register, /api/auth/me",
            "predict": "/api/predict (POST)",
            "animals": "/api/animals",
            "marketplace": "/api/listings, /api/saved",
            "enquiries": "/api/enquiries",
            "vets": "/api/vets",
            "dashboard": "/api/dashboard/farmer, /api/dashboard/middleman, /api/dashboard/admin",
            "breeds": "/api/breeds",
            "records": "/api/records (legacy)"
        }
    }

