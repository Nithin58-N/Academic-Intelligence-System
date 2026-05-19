"""
Centralized router imports for main.py
"""
from api.auth import router as auth_router
from api.chat import router as chat_router
from api.documents import router as documents_router
from api.notes import router as notes_router
from api.pyq import router as pyq_router
from api.speech import router as speech_router
from api.translation import router as translation_router

__all__ = [
    "auth_router",
    "chat_router",
    "documents_router",
    "notes_router",
    "pyq_router",
    "speech_router",
    "translation_router",
]
