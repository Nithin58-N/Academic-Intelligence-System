"""
Application Configuration Settings
"""

from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Academic AI System"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "academic-ai-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    MAIN_MODEL: str = "llama3:8b"
    EMBEDDING_MODEL: str = "nomic-embed-text"
    FAST_MODEL: str = "phi3"
    CODE_MODEL: str = "deepseek-coder"

    # ChromaDB
    CHROMA_DIR: str = "./chroma_db"
    CHROMA_COLLECTION: str = "academic_documents"

    # Directories
    UPLOAD_DIR: str = "./documents"
    AUDIO_DIR: str = "./audio"
    CACHE_DIR: str = "./cache"
    LOGS_DIR: str = "./logs"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./academic_ai.db"

    # PDF Processing
    MAX_FILE_SIZE_MB: int = 50
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # Speech
    WHISPER_MODEL: str = "base"  # tiny, base, small, medium, large
    PIPER_MODEL_DIR: str = "./models/piper"

    # Translation
    SUPPORTED_LANGUAGES: List[str] = ["en", "hi", "kn"]
    DEFAULT_LANGUAGE: str = "en"

    # RAG
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.3

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
