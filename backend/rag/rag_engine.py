"""
RAG Engine using langchain-community Ollama (no langchain-ollama needed)
"""

import json
import logging
from typing import AsyncGenerator, Dict, List, Optional

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

from prompts.templates import LANGUAGE_INSTRUCTIONS, SYSTEM_PROMPT
from rag.vector_store import vector_store
from utils.config import settings

logger = logging.getLogger("academic_ai")


class RAGEngine:
    """Core RAG engine for grounded academic responses."""

    def get_llm(self, model: str = None, temperature: float = 0.1) -> ChatOllama:
        return ChatOllama(
            model=model or settings.MAIN_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=temperature,
            num_ctx=4096,
        )

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
                SystemMessage(content=system_content),
                HumanMessage(content=question),
            ]

            llm = self.get_llm()
            response = await llm.ainvoke(messages)

            return {
                "answer": response.content,
                "sources": sources,
                "language": language,
                "model": settings.MAIN_MODEL,
            }

        except Exception as e:
            logger.error(f"RAG generation error: {e}")
            return {
                "answer": f"⚠️ Could not generate response. Please ensure Ollama is running with `ollama serve` and the model `{settings.MAIN_MODEL}` is pulled (`ollama pull {settings.MAIN_MODEL}`).",
                "sources": [],
                "language": language,
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
                SystemMessage(content=system_content),
                HumanMessage(content=question),
            ]

            llm = self.get_llm()
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

            async for chunk in llm.astream(messages):
                if chunk.content:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    async def generate_with_custom_prompt(
        self,
        prompt: str,
        temperature: float = 0.1,
        model: str = None,
    ) -> str:
        try:
            llm = self.get_llm(model=model, temperature=temperature)
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            return response.content
        except Exception as e:
            logger.error(f"Custom prompt error: {e}")
            raise


rag_engine = RAGEngine()
