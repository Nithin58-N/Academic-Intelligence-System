"""
JWT Authentication Utilities
Uses cryptography + bcrypt (available) instead of python-jose + passlib
"""

import hashlib
import hmac
import json
import base64
import time
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from utils.config import settings
from utils.database import User, get_db

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def create_access_token(data: dict, expires_delta_minutes: int = None) -> str:
    """Create a simple JWT token."""
    expire = int(time.time()) + (expires_delta_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    payload = {**data, "exp": expire}

    header = _b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body = _b64encode(json.dumps(payload).encode())
    signature_input = f"{header}.{body}".encode()
    sig = hmac.new(settings.SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
    signature = _b64encode(sig)

    return f"{header}.{body}.{signature}"


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header, body, signature = parts
        signature_input = f"{header}.{body}".encode()
        expected_sig = _b64encode(
            hmac.new(settings.SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
        )

        if not hmac.compare_digest(signature, expected_sig):
            return None

        payload = json.loads(_b64decode(body))
        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get current authenticated user (optional)."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    username = payload.get("sub")
    if not username:
        return None
    return db.query(User).filter(User.username == username).first()


def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Require authenticated user."""
    user = get_current_user(credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user
