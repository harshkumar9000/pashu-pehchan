"""
server/app/routes/auth.py
Authentication endpoints: registration, login, logout, and current user profile.
"""

from fastapi import APIRouter, HTTPException, Depends
from server.app.schemas.schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from server.app.services.auth.auth_service import (
    verify_password,
    create_access_token,
    get_current_user
)
from server.app.database.database import (
    create_user,
    get_user_by_identifier,
    get_user_by_id
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister):
    """
    Registers a new user (Farmer or Middleman).
    Enforces distinct validation based on role.
    """
    clean_phone = payload.phone.strip()
    existing = get_user_by_identifier(clean_phone)
    if existing:
        raise HTTPException(status_code=400, detail="A user with this mobile number already exists.")

    if payload.email:
        existing_email = get_user_by_identifier(payload.email.strip())
        if existing_email:
            raise HTTPException(status_code=400, detail="A user with this email address already exists.")

    role_upper = payload.role.strip().upper()
    if role_upper not in ["FARMER", "MIDDLEMAN", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be FARMER or MIDDLEMAN.")

    # Admin accounts cannot be publicly registered
    if role_upper == "ADMIN":
        raise HTTPException(status_code=403, detail="Admin accounts cannot be registered publicly.")

    try:
        user_dict = create_user(
            name=payload.name.strip(),
            phone=clean_phone,
            password=payload.password,
            role=role_upper,
            email=payload.email.strip() if payload.email else None,
            village=payload.village.strip() if payload.village else None,
            district=payload.district.strip() if payload.district else None,
            state=payload.state.strip() if payload.state else "Gujarat",
            business_name=payload.business_name.strip() if payload.business_name else None,
            contact_name=payload.contact_name.strip() if payload.contact_name else None,
            operating_region=payload.operating_region.strip() if payload.operating_region else None,
            business_type=payload.business_type.strip() if payload.business_type else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    token = create_access_token(
        user_id=user_dict["id"],
        role=user_dict["role"],
        name=user_dict["name"],
        phone=user_dict["phone"]
    )

    return TokenResponse(
        access_token=token,
        token_type="Bearer",
        user=UserResponse(**user_dict)
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin):
    """
    Authenticates user with mobile phone or email and password.
    Returns signed Bearer session token and user profile.
    """
    identifier = (payload.phone_or_email or payload.email or payload.phone or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Please provide a phone number or email address.")
    user_row = get_user_by_identifier(identifier)
    if not user_row:
        raise HTTPException(status_code=401, detail="Invalid phone/email or password.")

    if not verify_password(payload.password, user_row["salt"], user_row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid phone/email or password.")

    user_dict = get_user_by_id(user_row["id"])
    token = create_access_token(
        user_id=user_dict["id"],
        role=user_dict["role"],
        name=user_dict["name"],
        phone=user_dict["phone"]
    )

    return TokenResponse(
        access_token=token,
        token_type="Bearer",
        user=UserResponse(**user_dict)
    )

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Logs out the active session."""
    return {"status": "success", "message": "Successfully logged out."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieves authenticated user profile."""
    user = get_user_by_id(current_user["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserResponse(**user)
