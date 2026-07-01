"""
Offline Multilingual AI Academic Intelligence System
FastAPI Backend Entry Point
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, str(Path(__file__).parent))

from api.routes import (
    auth_router,
    chat_router,
    documents_router,
    notes_router,
    pyq_router,
    speech_router,
    translation_router,
)
from utils.config import settings
from utils.database import init_db
from utils.logger import setup_logger, logger
from ai_providers import get_provider


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logger()
    logger.info("Starting Academic AI System...")

    # Initialize AI Provider
    try:
        provider = get_provider()
        logger.info(f"AI Provider initialized: {provider.provider_name.upper()}")
        logger.info(f"Model: {provider.model}")
    except Exception as e:
        logger.error(f"Failed to initialize AI provider: {e}")
        raise

    # Init SQLite DB (sync)
    init_db()
    logger.info("Database initialized")

    # Ensure directories exist
    for d in [settings.UPLOAD_DIR, settings.CHROMA_DIR,
              settings.AUDIO_DIR, settings.CACHE_DIR, settings.LOGS_DIR]:
        Path(d).mkdir(parents=True, exist_ok=True)

    logger.info(f"Server ready at http://{settings.HOST}:{settings.PORT}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Offline Multilingual AI Academic Intelligence System",
    description="AI-powered academic assistant for engineering students",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # covers all Vercel preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve audio files
audio_path = Path(settings.AUDIO_DIR)
audio_path.mkdir(parents=True, exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(audio_path)), name="audio")

# Register routers
app.include_router(auth_router,        prefix="/api/auth",        tags=["Auth"])
app.include_router(chat_router,        prefix="/api/chat",        tags=["Chat"])
app.include_router(documents_router,   prefix="/api/documents",   tags=["Documents"])
app.include_router(notes_router,       prefix="/api/notes",       tags=["Notes"])
app.include_router(pyq_router,         prefix="/api/pyq",         tags=["PYQ"])
app.include_router(speech_router,      prefix="/api/speech",      tags=["Speech"])
app.include_router(translation_router, prefix="/api/translation", tags=["Translation"])


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    from fastapi.responses import FileResponse
    favicon_path = Path(__file__).parent / "static" / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(str(favicon_path))
    from fastapi.responses import Response
    return Response(status_code=204)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "system": "Offline Multilingual AI Academic Intelligence System",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Detailed health check — shows Groq status, Ollama embedding status,
    active provider, and model availability.
    """
    import requests as _requests

    result: dict = {
        "status": "healthy",
        "system": "online",
        "provider": {},
        "ollama_embeddings": {},
    }

    # ── AI provider (Groq or Ollama) ──────────────────────────────────────────
    try:
        provider = get_provider()
        result["provider"] = provider.check_health()
        result["provider"]["active"] = True
    except Exception as e:
        logger.error(f"Health check — provider error: {e}")
        result["provider"] = {"status": "offline", "error": str(e), "active": False}
        result["status"] = "degraded"

    # ── Ollama embeddings (always needed for RAG) ─────────────────────────────
    try:
        resp = _requests.get(
            f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=3
        )
        if resp.status_code == 200:
            models = [m["name"] for m in resp.json().get("models", [])]
            embed_model = settings.OLLAMA_EMBEDDING_MODEL
            result["ollama_embeddings"] = {
                "status": "online",
                "embedding_model": embed_model,
                "model_available": any(embed_model in m for m in models),
                "url": settings.OLLAMA_BASE_URL,
            }
        else:
            result["ollama_embeddings"] = {
                "status": "offline",
                "error": f"HTTP {resp.status_code}",
                "url": settings.OLLAMA_BASE_URL,
            }
    except Exception as e:
        result["ollama_embeddings"] = {
            "status": "offline",
            "error": str(e),
            "url": settings.OLLAMA_BASE_URL,
        }

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
