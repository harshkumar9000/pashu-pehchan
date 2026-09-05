"""
server/app/services/auth/auth_service.py
Authentication & Session security using PBKDF2 password hashing and HMAC-SHA256 signed bearer tokens.
Zero external library dependencies (uses Python standard library).
"""

import os
import time
import json
import base64
import hmac
import hashlib
import secrets
from typing import Dict, Any, Optional, List
from fastapi import Header, HTTPException, Depends

# Secret key for HMAC token signing (can be configured via env)
AUTH_SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "vetra-livestock-hackathon-secret-key-2026")
TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60  # 7 days

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes a password with PBKDF2-HMAC-SHA256."""
    if not salt:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pwd_hash, salt

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    """Verifies password against stored PBKDF2 hash using constant-time comparison."""
    calculated_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(calculated_hash, expected_hash)

def create_access_token(user_id: int, role: str, name: str, phone: str) -> str:
    """Generates an HMAC-SHA256 signed bearer token."""
    payload = {
        "sub": user_id,
        "role": role,
        "name": name,
        "phone": phone,
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS
    }
    payload_bytes = json.dumps(payload).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8').rstrip('=')
    
    signature = hmac.new(
        AUTH_SECRET_KEY.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return f"{payload_b64}.{signature}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates token signature and expiry."""
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        
        expected_sig = hmac.new(
            AUTH_SECRET_KEY.encode('utf-8'),
            payload_b64.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            return None
        
        # Add padding back for base64 decode
        padded = payload_b64 + '=' * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode('utf-8')).decode('utf-8'))
        
        if payload.get("exp", 0) < time.time():
            return None  # Expired
            
        return payload
    except Exception:
        return None

def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Dependency: Extract current user payload if Authorization header is present, else None."""
    if not authorization:
        return None
    scheme, _, token = authorization.partition(' ')
    if scheme.lower() != 'bearer' or not token:
        return None
    return decode_access_token(token)

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency: Requires a valid authenticated user token."""
    user = get_current_user_optional(authorization)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid Bearer token."
        )
    return user

def require_role(allowed_roles: List[str]):
    """Role-based authorization dependency factory."""
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = user.get("role", "").upper()
        if user_role not in [r.upper() for r in allowed_roles] and user_role != "ADMIN":
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. This action requires one of the following roles: {allowed_roles}"
            )
        return user
    return role_checker
