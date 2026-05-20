"""
Ollama provider implementation.
Wraps LangChain ChatOllama for compatibility with the provider abstraction.
Supports both streaming and non-streaming responses.
"""

from typing import AsyncGenerator, Dict, List, Any, Optional
from ai_providers.base import BaseAIProvider
import asyncio

try:
    from langchain_community.chat_models import ChatOllama
    from langchain_core.messages import SystemMessage, HumanMessage
except ImportError:
    raise ImportError(
        "langchain and langchain-community required for Ollama provider. "
        "Install with: pip install langchain langchain-community"
    )


class OllamaProvider(BaseAIProvider):
    """
    Ollama provider using LangChain ChatOllama.
    
    Supports local Ollama instance with streaming.
    Models: llama3:8b, phi3, deepseek-coder, nomic-embed-text, etc.
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        main_model: str = "llama3:8b",
        fast_model: str = "phi3",
        timeout: int = 30,
    ):
        """
        Initialize Ollama provider.
        
        Args:
            base_url: Ollama API endpoint
            main_model: Main model for chat/inference
            fast_model: Fast model for quick tasks (translation, etc.)
            timeout: Request timeout in seconds
        """
        self.base_url = base_url
        self._main_model = main_model
        self.fast_model = fast_model
        self.timeout = timeout
        
        # Lazy load LangChain ChatOllama
        self._chat_llm = None
        self._fast_llm = None
    
    def _get_chat_llm(self, temperature: float = 0.1) -> ChatOllama:
        """Get main chat model instance."""
        return ChatOllama(
            model=self._main_model,
            base_url=self.base_url,
            temperature=temperature,
            num_ctx=4096,
        )
    
    def _get_fast_llm(self, temperature: float = 0.1) -> ChatOllama:
        """Get fast model instance for quick tasks."""
        return ChatOllama(
            model=self.fast_model,
            base_url=self.base_url,
            temperature=temperature,
            num_ctx=2048,
        )
    
    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
        model: str = "main",
        **kwargs: Any,
    ) -> str:
        """
        Generate response from Ollama.
        Non-streaming for simple responses.
        
        Args:
            messages: List of message dicts
            temperature: Sampling temperature
            max_tokens: Maximum tokens (ignored, Ollama uses num_ctx)
            model: "main" or "fast" model selection
            **kwargs: Additional parameters
            
        Returns:
            Generated response text
        """
        try:
            # Convert message dicts to LangChain message objects
            lc_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    lc_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    lc_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    # Note: LangChain also has AIMessage
                    from langchain_core.messages import AIMessage
                    lc_messages.append(AIMessage(content=msg["content"]))
            
            # Select model
            llm = self._get_fast_llm(temperature) if model == "fast" else self._get_chat_llm(temperature)
            
            # Async invoke
            response = await llm.ainvoke(lc_messages)
            return response.content or ""
        
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")
    
    async def stream_generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
        model: str = "main",
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """
        Stream response from Ollama using astream.
        Yields tokens as they are generated.
        
        Args:
            messages: List of message dicts
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            model: "main" or "fast" model selection
            **kwargs: Additional parameters
            
        Yields:
            Token strings as they are generated
        """
        try:
            # Convert message dicts to LangChain message objects
            lc_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    lc_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    lc_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    from langchain_core.messages import AIMessage
                    lc_messages.append(AIMessage(content=msg["content"]))
            
            # Select model
            llm = self._get_fast_llm(temperature) if model == "fast" else self._get_chat_llm(temperature)
            
            # Stream tokens
            async for chunk in llm.astream(lc_messages):
                if chunk.content:
                    yield chunk.content
        
        except Exception as e:
            raise Exception(f"Ollama streaming error: {str(e)}")
    
    def check_health(self) -> Dict[str, Any]:
        """
        Check Ollama connectivity.
        
        Returns:
            Health status dict
        """
        try:
            import requests
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                return {
                    "provider": "ollama",
                    "status": "online",
                    "model": self._main_model,
                }
            else:
                return {
                    "provider": "ollama",
                    "status": "offline",
                    "model": self._main_model,
                    "error": f"HTTP {response.status_code}",
                }
        except Exception as e:
            return {
                "provider": "ollama",
                "status": "offline",
                "model": self._main_model,
                "error": str(e),
            }
    
    @property
    def provider_name(self) -> str:
        return "ollama"
    
    @property
    def model(self) -> str:
        return self._main_model
