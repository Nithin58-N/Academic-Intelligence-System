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

    # AI Provider Configuration
    AI_PROVIDER: str = "groq"  # "groq" or "ollama"
    REQUEST_TIMEOUT: int = 30  # seconds for API requests

    # Groq Configuration (primary provider — ultra-fast cloud inference)
    GROQ_API_KEY: str = ""  # Required when AI_PROVIDER=groq — get at https://console.groq.com/keys
    GROQ_MODEL: str = "llama-3.1-8b-instant"  # Fast default; alternatives: llama3-70b-8192, gemma2-9b-it, mixtral-8x7b-32768

    # Ollama Configuration (local embeddings + optional offline fallback)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MAIN_MODEL: str = "llama3:8b"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"  # Always used for embeddings regardless of AI_PROVIDER
    OLLAMA_FAST_MODEL: str = "phi3"
    OLLAMA_CODE_MODEL: str = "deepseek-coder"

    # Legacy names (kept for backward compatibility)
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
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._validate_config()
    
    def _validate_config(self):
        """Validate configuration on startup."""
        if self.AI_PROVIDER.lower() == "groq" and not self.GROQ_API_KEY:
            import warnings
            warnings.warn(
                "AI_PROVIDER is set to 'groq' but GROQ_API_KEY is not configured. "
                "Set GROQ_API_KEY in .env file or as environment variable. "
                "Falling back to Ollama.",
                UserWarning,
            )
            self.AI_PROVIDER = "ollama"


settings = Settings()
