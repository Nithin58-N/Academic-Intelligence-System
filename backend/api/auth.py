"""Authentication API Routes"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from utils.auth import create_access_token, hash_password, verify_password, require_auth
from utils.database import User, ChatSession, Document, get_db

router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    username: str = ""  # optional, derived from email if not provided
    preferred_language: str = "en"


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    full_name: str = ""
    preferred_language: str = "en"


def _user_response(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name or "",
        "preferred_language": user.preferred_language or "en",
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Derive username from email if not provided
    username = data.username.strip() or data.email.split("@")[0]

    # Uniqueness checks
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == username).first():
        # Make username unique by appending a counter
        base = username
        counter = 1
        while db.query(User).filter(User.username == f"{base}{counter}").first():
            counter += 1
        username = f"{base}{counter}"

    user = User(
        username=username,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name.strip(),
        preferred_language=data.preferred_language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_response(user),
    }


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Allow login by email
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_response(user),
    }


@router.get("/me")
def get_me(current_user: User = Depends(require_auth)):
    return _user_response(current_user)


@router.put("/profile")
def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    if data.full_name:
        current_user.full_name = data.full_name.strip()
    if data.preferred_language:
        current_user.preferred_language = data.preferred_language
    db.commit()
    db.refresh(current_user)
    return _user_response(current_user)


@router.get("/stats")
def get_user_stats(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Return per-user stats for the profile page."""
    total_chats = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .count()
    )
    total_documents = (
        db.query(Document)
        .filter(Document.uploaded_by == current_user.id)
        .count()
    )
    return {
        "total_chats": total_chats,
        "total_documents": total_documents,
        "member_since": current_user.created_at.isoformat() if current_user.created_at else None,
    }
