"""
Abstract base class for AI providers.
Defines the interface all AI providers must implement.
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, List, Any, Optional


class BaseAIProvider(ABC):
    """
    Abstract base class for AI providers.

    All AI providers (Groq, Ollama, OpenAI, etc.) must implement
    this interface to be compatible with the RAG engine.
    """
    
    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> str:
        """
        Generate a complete response from messages.
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
                     e.g., [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]
            temperature: Sampling temperature (0.0-2.0). Lower = more deterministic.
            max_tokens: Maximum tokens in response (if supported by provider)
            **kwargs: Provider-specific parameters
            
        Returns:
            Generated response text as string
            
        Raises:
            Exception: If API call fails or provider is unavailable
        """
        pass
    
    @abstractmethod
    async def stream_generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """
        Stream generated response tokens.
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens in response
            **kwargs: Provider-specific parameters
            
        Yields:
            Token strings as they are generated
            
        Raises:
            Exception: If API call fails or provider is unavailable
        """
        pass
    
    @abstractmethod
    def check_health(self) -> Dict[str, Any]:
        """
        Check provider health and connectivity.
        
        Returns:
            Dict with status info:
            {
                "provider": "groq" | "ollama",
                "status": "online" | "offline",
                "model": str,
                "error": str (optional)
            }
        """
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns provider name (e.g., 'groq', 'ollama')"""
        pass
    
    @property
    @abstractmethod
    def model(self) -> str:
        """Returns current model name"""
        pass
