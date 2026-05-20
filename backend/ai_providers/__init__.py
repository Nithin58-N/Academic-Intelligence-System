"""
AI Provider abstraction layer.
Supports Groq (cloud, fast inference) and Ollama (local, offline).

Provider selection is controlled by AI_PROVIDER in .env:
  AI_PROVIDER=groq    → GroqProvider  (default)
  AI_PROVIDER=ollama  → OllamaProvider

Ollama is always used for embeddings regardless of AI_PROVIDER.
"""

import logging

from ai_providers.base import BaseAIProvider
from ai_providers.groq_provider import GroqProvider
from ai_providers.ollama import OllamaProvider
from utils.config import settings

logger = logging.getLogger("academic_ai")


def get_provider() -> BaseAIProvider:
    """
    Factory — returns the configured AI provider instance.

    Returns:
        BaseAIProvider: GroqProvider or OllamaProvider

    Raises:
        ValueError: If provider name is unrecognised or required config is missing
    """
    provider_name = settings.AI_PROVIDER.lower()

    if provider_name == "groq":
        if not settings.GROQ_API_KEY:
            raise ValueError(
                "GROQ_API_KEY is not set. "
                "Add it to backend/.env or set AI_PROVIDER=ollama for local mode."
            )
        logger.info(f"Using Groq provider | model={settings.GROQ_MODEL}")
        return GroqProvider(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
            timeout=settings.REQUEST_TIMEOUT,
        )

    elif provider_name == "ollama":
        logger.info(f"Using Ollama provider | model={settings.OLLAMA_MAIN_MODEL}")
        return OllamaProvider(
            base_url=settings.OLLAMA_BASE_URL,
            main_model=settings.OLLAMA_MAIN_MODEL,
            fast_model=settings.OLLAMA_FAST_MODEL,
            timeout=settings.REQUEST_TIMEOUT,
        )

    else:
        raise ValueError(
            f"Unknown AI_PROVIDER: '{provider_name}'. "
            "Must be 'groq' or 'ollama'."
        )


__all__ = ["BaseAIProvider", "GroqProvider", "OllamaProvider", "get_provider"]
