"""
server/app/schemas/schemas.py
Pydantic data models for request validation and API responses across Vetra.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# =====================================================================
# AUTH SCHEMAS
# =====================================================================

class UserRegister(BaseModel):
    name: str
    phone: str
    password: str
    role: str = Field("FARMER", description="FARMER, MIDDLEMAN, or ADMIN")
    email: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Gujarat"
    business_name: Optional[str] = None
    contact_name: Optional[str] = None
    operating_region: Optional[str] = None
    business_type: Optional[str] = None

class UserLogin(BaseModel):
    phone_or_email: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    role: str
    email: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Gujarat"
    business_name: Optional[str] = None
    contact_name: Optional[str] = None
    operating_region: Optional[str] = None
    business_type: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserResponse


# =====================================================================
# INFERENCE & BREED SCHEMAS (PRESERVED)
# =====================================================================

class PredictionItem(BaseModel):
    breed: str
    confidence: float
    percentage: float
    animal_type: str

class TopPrediction(BaseModel):
    breed: str
    confidence: float
    animal_type: str

class PredictResponse(BaseModel):
    status: str = "success"
    predictions: List[PredictionItem]
    top_prediction: TopPrediction
    confidence_level: str
    recommendation: str
    model_version: str
    architecture: str
    animal_type: str
    device: str
    inference_time_ms: float

class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool
    model_version: str
    classes: int
    device: str
    architecture: str
    top1_accuracy: Optional[float] = 86.42
    top3_accuracy: Optional[float] = 96.85
    macro_f1: Optional[float] = 84.90

class BreedItem(BaseModel):
    breed: str
    display_name: str
    animal_type: str
    region: Optional[str] = None
    characteristics: Optional[str] = None
    purpose: Optional[str] = None
    horn_type: Optional[str] = None
    coat_color: Optional[str] = None


# =====================================================================
# ANIMAL MANAGEMENT SCHEMAS
# =====================================================================

class AnimalCreate(BaseModel):
    animal_identifier: Optional[str] = None
    tag_number: Optional[str] = None
    animal_type: Optional[str] = "Cattle"
    species: Optional[str] = None
    predicted_breed: Optional[str] = None
    predicted_confidence: Optional[float] = None
    confidence_score: Optional[float] = None
    verified_breed: Optional[str] = None
    breed: Optional[str] = None
    verification_status: Optional[str] = "Human Verified"
    is_human_verified: Optional[int] = 1
    pashu_aadhaar: Optional[str] = None
    sex: Optional[str] = "Female"
    age: Optional[int] = 3
    age_months: Optional[int] = None
    color: Optional[str] = "Reddish brown"
    weight: Optional[float] = 380.0
    milk_production: Optional[float] = 0.0
    daily_milk_yield_litres: Optional[float] = None
    pregnancy_status: Optional[str] = "Not pregnant"
    vaccination_status: Optional[str] = "FMD Vaccinated"
    for_sale: Optional[bool] = False
    status: Optional[str] = "IN_HERD"
    health_status: Optional[str] = "HEALTHY"
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model_version: Optional[str] = "efficientnet_b0-41c-2026-09-05"

class AnimalUpdate(BaseModel):
    breed: Optional[str] = None
    verified_breed: Optional[str] = None
    verification_status: Optional[str] = None
    age: Optional[int] = None
    milk_production: Optional[float] = None
    pregnancy_status: Optional[str] = None
    vaccination_status: Optional[str] = None
    for_sale: Optional[bool] = None
    notes: Optional[str] = None
    color: Optional[str] = None
    weight: Optional[float] = None

class AnimalVerifyPayload(BaseModel):
    verified_breed: str
    verification_status: str = "Human Verified"
    notes: Optional[str] = None

class AnimalResponse(BaseModel):
    id: int
    owner_id: Optional[int] = 1
    animal_identifier: Optional[str]
    pashu_aadhaar: Optional[str] = None
    animal_type: str
    breed: Optional[str] = None
    sex: Optional[str] = "Female"
    age: Optional[int] = 3
    color: Optional[str] = None
    weight: Optional[float] = None
    photo_url: Optional[str] = None
    predicted_breed: str
    predicted_confidence: float
    verified_breed: str
    verification_status: str
    notes: Optional[str] = None
    milk_production: Optional[float] = 0.0
    pregnancy_status: Optional[str] = None
    vaccination_status: Optional[str] = None
    for_sale: Optional[int] = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model_version: str
    is_demo: int = 0
    created_at: str
    updated_at: Optional[str] = None


# =====================================================================
# MARKETPLACE SCHEMAS
# =====================================================================

class ListingCreate(BaseModel):
    animal_id: int
    title: str
    price: float
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    district: Optional[str] = None

class ListingStatusUpdate(BaseModel):
    status: str = Field(..., description="Active, Pending, Sold, Expired")

class ListingResponse(BaseModel):
    id: int
    animal_id: int
    seller_id: int
    title: str
    breed: str
    animal_type: str
    age: int
    sex: str
    price: float
    description: Optional[str] = None
    status: str
    district: str
    state: str = "Gujarat"
    contact_phone: str
    photo_url: Optional[str] = None
    is_verified: int = 1
    verified_breed: Optional[str] = None
    predicted_confidence: Optional[float] = None
    milk_production: Optional[float] = None
    created_at: str
    updated_at: str
    seller_name: Optional[str] = None
    seller_village: Optional[str] = None
    seller_district: Optional[str] = None
    saved_at: Optional[str] = None


# =====================================================================
# ENQUIRY SCHEMAS
# =====================================================================

class EnquiryCreate(BaseModel):
    listing_id: int
    message: str

class EnquiryStatusUpdate(BaseModel):
    status: str = Field(..., description="Sent, Received, Accepted, Rejected, Closed")
    response_note: Optional[str] = None

class EnquiryResponse(BaseModel):
    id: int
    listing_id: int
    animal_id: int
    middleman_id: int
    farmer_id: int
    message: str
    status: str
    response_note: Optional[str] = None
    created_at: str
    updated_at: str
    listing_title: Optional[str] = None
    listing_price: Optional[float] = None
    listing_breed: Optional[str] = None
    middleman_name: Optional[str] = None
    middleman_phone: Optional[str] = None
    middleman_company: Optional[str] = None
    farmer_name: Optional[str] = None
    farmer_phone: Optional[str] = None


# =====================================================================
# VETERINARY SERVICES SCHEMAS
# =====================================================================

class VetResponse(BaseModel):
    id: int
    name: str
    facility_type: str
    phone: str
    address: str
    district: str
    state: str = "Gujarat"
    latitude: float
    longitude: float
    services_offered: str
    is_emergency: int
    open_status: str
    distance_km: Optional[float] = None
    is_demo: int = 1
    created_at: str


# =====================================================================
# NOTIFICATION SCHEMAS
# =====================================================================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: int
    related_id: Optional[int] = None
    created_at: str


# =====================================================================
# ROLE-BASED DASHBOARD SCHEMAS
# =====================================================================

class FarmerDashboardResponse(BaseModel):
    total_animals: int
    verified_animals: int
    for_sale_count: int
    pending_enquiries: int
    recent_animals: List[Dict[str, Any]]

class MiddlemanDashboardResponse(BaseModel):
    available_listings: int
    verified_listings: int
    saved_count: int
    sent_enquiries: int
    recent_listings: List[Dict[str, Any]]

class AdminDashboardResponse(BaseModel):
    total_farmers: int
    total_middlemen: int
    total_animals: int
    verified_records: int
    overridden_records: int
    verification_rate: float
    active_listings: int
    total_enquiries: int
    average_confidence: float
    model_architecture: str
    model_version: str
    top1_accuracy: float
    top3_accuracy: float
    total_users: Optional[int] = None
    farmers_count: Optional[int] = None
    middlemen_count: Optional[int] = None
    verified_percentage: Optional[float] = None
    model_inference_count: Optional[int] = None
    avg_inference_latency_ms: Optional[float] = None


# =====================================================================
# LEGACY SCHEMAS (PRESERVED FOR BACKWARD COMPATIBILITY)
# =====================================================================

class RecordCreate(BaseModel):
    predicted_breed: str
    predicted_confidence: float
    verified_breed: str
    verification_status: str
    animal_identifier: Optional[str] = None
    animal_type: Optional[str] = "Cattle"
    notes: Optional[str] = None
    model_version: Optional[str] = "efficientnet_b0-41c-2026-09-04"
    top3_data: Optional[List[Dict[str, Any]]] = None
    inference_time_ms: Optional[float] = 0.0

class RecordResponse(BaseModel):
    id: int
    animal_identifier: Optional[str] = None
    animal_type: str = "Cattle"
    predicted_breed: str
    predicted_confidence: float
    verified_breed: str
    verification_status: str
    notes: Optional[str] = None
    model_version: str
    is_demo: int = 0
    created_at: str

class DashboardResponse(BaseModel):
    total_records: int
    verified_records: int
    overridden_records: int
    manual_review_records: int
    verification_rate: float
    average_confidence: float
    top_breeds: List[Dict[str, Any]]
    species_counts: List[Dict[str, Any]]
    confidence_distribution: Dict[str, int]
