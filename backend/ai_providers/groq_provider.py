"""
Groq API provider implementation.
Uses OpenAI-compatible SDK pointed at Groq's endpoint.
Base URL: https://api.groq.com/openai/v1

Supported models:
  - llama-3.1-8b-instant   (fast, default)
  - llama3-70b-8192        (powerful)
  - gemma2-9b-it           (Google Gemma)
  - mixtral-8x7b-32768     (Mixtral MoE)
"""

import asyncio
import logging
import time
from typing import Any, AsyncGenerator, Dict, List, Optional

from ai_providers.base import BaseAIProvider

logger = logging.getLogger("academic_ai")

try:
    from openai import AsyncOpenAI, APIStatusError, APITimeoutError, RateLimitError
except ImportError:
    raise ImportError(
        "openai package required for Groq provider. "
        "Install with: pip install openai>=1.40.0"
    )

# Groq-supported models
GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
]

DEFAULT_MODEL = "llama-3.1-8b-instant"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# Retry config
MAX_RETRIES = 3
RETRY_DELAY = 2.0  # seconds


class GroqProvider(BaseAIProvider):
    """
    Groq API provider using OpenAI-compatible client.

    Groq offers ultra-fast LLM inference via its LPU hardware.
    The API is fully OpenAI-compatible, so we use the openai SDK
    with a custom base_url.

    Flow:
        Frontend → FastAPI → RAG Retrieval → Prompt Templates
        → GroqProvider.generate() → Groq API → Response
    """

    def __init__(
        self,
        api_key: str,
        model: str = DEFAULT_MODEL,
        timeout: int = 30,
    ):
        """
        Initialize Groq provider.

        Args:
            api_key:  Groq API key (starts with gsk_...)
            model:    Model name — defaults to llama-3.1-8b-instant
            timeout:  Request timeout in seconds
        """
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY is required. "
                "Get one at https://console.groq.com/keys"
            )

        self.api_key = api_key
        self._model = model
        self.timeout = timeout

        # OpenAI-compatible client pointed at Groq
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=GROQ_BASE_URL,
            timeout=timeout,
            max_retries=0,  # We handle retries manually for better logging
        )

        logger.info(f"GroqProvider initialized | model={model} | base_url={GROQ_BASE_URL}")

    # ──────────────────────────────────────────────────────────────────────────
    # Core generation
    # ──────────────────────────────────────────────────────────────────────────

    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> str:
        """
        Generate a complete response from Groq API.

        Args:
            messages:    List of {"role": ..., "content": ...} dicts
            temperature: Sampling temperature (0.0–2.0)
            max_tokens:  Max tokens in response (default: 4096)
            **kwargs:    Ignored (for interface compatibility)

        Returns:
            Generated response text

        Raises:
            Exception: On API error after retries
        """
        last_error: Optional[Exception] = None

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                start = time.monotonic()
                logger.debug(
                    f"Groq generate | attempt={attempt} | model={self._model} "
                    f"| messages={len(messages)}"
                )

                response = await self.client.chat.completions.create(
                    model=self._model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens or 4096,
                    stream=False,
                )

                elapsed = time.monotonic() - start
                usage = response.usage
                logger.info(
                    f"Groq response | model={self._model} | "
                    f"prompt_tokens={usage.prompt_tokens if usage else '?'} | "
                    f"completion_tokens={usage.completion_tokens if usage else '?'} | "
                    f"elapsed={elapsed:.2f}s"
                )

                return response.choices[0].message.content or ""

            except RateLimitError as e:
                last_error = e
                wait = RETRY_DELAY * attempt
                logger.warning(
                    f"Groq rate limit hit (attempt {attempt}/{MAX_RETRIES}). "
                    f"Retrying in {wait}s..."
                )
                await asyncio.sleep(wait)

            except APITimeoutError as e:
                last_error = e
                logger.warning(
                    f"Groq timeout (attempt {attempt}/{MAX_RETRIES}): {e}"
                )
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)

            except APIStatusError as e:
                # 401 = bad key, 400 = bad request — don't retry
                logger.error(
                    f"Groq API error {e.status_code}: {e.message}"
                )
                if e.status_code in (400, 401, 403):
                    raise Exception(
                        f"Groq API error {e.status_code}: {e.message}. "
                        "Check your GROQ_API_KEY."
                    ) from e
                last_error = e
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)

            except Exception as e:
                last_error = e
                logger.error(f"Groq unexpected error (attempt {attempt}): {e}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)

        raise Exception(
            f"Groq API failed after {MAX_RETRIES} attempts. "
            f"Last error: {last_error}"
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Streaming generation
    # ──────────────────────────────────────────────────────────────────────────

    async def stream_generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """
        Stream response tokens from Groq API (true streaming via SSE).

        Args:
            messages:    List of {"role": ..., "content": ...} dicts
            temperature: Sampling temperature
            max_tokens:  Max tokens in response
            **kwargs:    Ignored

        Yields:
            Token strings as they arrive
        """
        try:
            logger.debug(
                f"Groq stream_generate | model={self._model} | messages={len(messages)}"
            )
            start = time.monotonic()
            token_count = 0

            stream = await self.client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens or 4096,
                stream=True,
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    token_count += 1
                    yield delta.content

            elapsed = time.monotonic() - start
            logger.info(
                f"Groq stream complete | model={self._model} | "
                f"chunks={token_count} | elapsed={elapsed:.2f}s"
            )

        except RateLimitError as e:
            logger.error(f"Groq rate limit during streaming: {e}")
            raise Exception(f"Groq rate limit exceeded. Please try again shortly.") from e

        except APITimeoutError as e:
            logger.error(f"Groq timeout during streaming: {e}")
            raise Exception(f"Groq request timed out after {self.timeout}s.") from e

        except APIStatusError as e:
            logger.error(f"Groq API status error {e.status_code} during streaming: {e.message}")
            if e.status_code in (401, 403):
                raise Exception(
                    f"Groq authentication failed. Check your GROQ_API_KEY."
                ) from e
            raise Exception(f"Groq API error {e.status_code}: {e.message}") from e

        except Exception as e:
            logger.error(f"Groq streaming error: {e}")
            raise Exception(f"Groq streaming failed: {str(e)}") from e

    # ──────────────────────────────────────────────────────────────────────────
    # Health check
    # ──────────────────────────────────────────────────────────────────────────

    def check_health(self) -> Dict[str, Any]:
        """
        Check Groq API connectivity with a minimal test request.

        Returns:
            {
                "provider": "groq",
                "status": "online" | "offline",
                "model": str,
                "base_url": str,
                "error": str  (only when offline)
            }
        """
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def _ping():
                return await self.client.chat.completions.create(
                    model=self._model,
                    messages=[{"role": "user", "content": "hi"}],
                    max_tokens=5,
                    temperature=0.0,
                )

            loop.run_until_complete(_ping())
            loop.close()

            logger.info(f"Groq health check passed | model={self._model}")
            return {
                "provider": "groq",
                "status": "online",
                "model": self._model,
                "base_url": GROQ_BASE_URL,
            }

        except Exception as e:
            logger.warning(f"Groq health check failed: {e}")
            return {
                "provider": "groq",
                "status": "offline",
                "model": self._model,
                "base_url": GROQ_BASE_URL,
                "error": str(e),
            }

    # ──────────────────────────────────────────────────────────────────────────
    # Properties
    # ──────────────────────────────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return "groq"

    @property
    def model(self) -> str:
        return self._model
