"""
RAG Engine using pluggable AI providers (Groq or Ollama)
"""

import json
import logging
from typing import AsyncGenerator, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from prompts.templates import LANGUAGE_INSTRUCTIONS, SYSTEM_PROMPT
from rag.vector_store import vector_store
from utils.config import settings
from ai_providers import get_provider

logger = logging.getLogger("academic_ai")


class RAGEngine:
    """Core RAG engine for grounded academic responses using pluggable AI providers."""

    def __init__(self):
        """Initialize RAG engine with provider."""
        self.provider = get_provider()

    async def retrieve_context(
        self,
        query: str,
        doc_ids: Optional[List[str]] = None,
        k: int = None,
    ):
        results = vector_store.similarity_search(
            query=query,
            k=k or settings.TOP_K_RESULTS,
            filter_doc_ids=doc_ids,
        )
        context = vector_store.format_context(results)
        sources = [
            {
                "source": doc.metadata.get("source", "Unknown"),
                "page": doc.metadata.get("page", 0),
                "score": round(score, 3),
                "doc_id": doc.metadata.get("doc_id", ""),
            }
            for doc, score in results
        ]
        return context, sources

    async def generate_response(
        self,
        question: str,
        language: str = "en",
        chat_history: List[Dict] = None,
        doc_ids: Optional[List[str]] = None,
    ) -> Dict:
        try:
            context, sources = await self.retrieve_context(question, doc_ids)

            history_str = ""
            if chat_history:
                for msg in chat_history[-6:]:
                    role = "Human" if msg["role"] == "user" else "Assistant"
                    history_str += f"{role}: {msg['content']}\n"

            lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, "")
            system_content = SYSTEM_PROMPT.format(
                context=context,
                chat_history=history_str or "No previous conversation.",
            )
            if lang_instruction:
                system_content += f"\n\nIMPORTANT: {lang_instruction}"

            messages = [
                {"role": "system", "content": system_content},
                {"role": "user", "content": question},
            ]

            # Use provider abstraction for inference
            response = await self.provider.generate(messages, temperature=0.1)

            return {
                "answer": response,
                "sources": sources,
                "language": language,
                "provider": self.provider.provider_name,
                "model": self.provider.model,
            }

        except Exception as e:
            logger.error(f"RAG generation error ({self.provider.provider_name}): {e}")
            return {
                "answer": f"⚠️ Could not generate response. Provider: {self.provider.provider_name}, Error: {str(e)}",
                "sources": [],
                "language": language,
                "provider": self.provider.provider_name,
                "error": str(e),
            }

    async def stream_response(
        self,
        question: str,
        language: str = "en",
        chat_history: List[Dict] = None,
        doc_ids: Optional[List[str]] = None,
    ) -> AsyncGenerator[str, None]:
        try:
            context, sources = await self.retrieve_context(question, doc_ids)

            history_str = ""
            if chat_history:
                for msg in chat_history[-6:]:
                    role = "Human" if msg["role"] == "user" else "Assistant"
                    history_str += f"{role}: {msg['content']}\n"

            lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, "")
            system_content = SYSTEM_PROMPT.format(
                context=context,
                chat_history=history_str or "No previous conversation.",
            )
            if lang_instruction:
                system_content += f"\n\nIMPORTANT: {lang_instruction}"

            messages = [
                {"role": "system", "content": system_content},
                {"role": "user", "content": question},
            ]

            # Send sources metadata first
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources, 'provider': self.provider.provider_name})}\n\n"

            # Stream response using provider
            # Groq: true token-by-token streaming via SSE
            # Ollama: token-by-token via astream
            async for chunk in self.provider.stream_generate(messages, temperature=0.1):
                if chunk:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'provider': self.provider.provider_name})}\n\n"

        except Exception as e:
            logger.error(f"Streaming error ({self.provider.provider_name}): {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e), 'provider': self.provider.provider_name})}\n\n"

    async def generate_with_custom_prompt(
        self,
        prompt: str,
        temperature: float = 0.1,
        model: str = None,
    ) -> str:
        try:
            messages = [{"role": "user", "content": prompt}]
            response = await self.provider.generate(messages, temperature=temperature)
            return response
        except Exception as e:
            logger.error(f"Custom prompt error ({self.provider.provider_name}): {e}")
            raise


rag_engine = RAGEngine()
