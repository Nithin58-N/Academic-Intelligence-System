"""
Embedding Pipeline using Ollama nomic-embed-text via langchain-community
"""

import logging
from typing import List

from langchain_ollama import OllamaEmbeddings

from utils.config import settings

logger = logging.getLogger("academic_ai")


class EmbeddingPipeline:
    """Manages document embeddings using Ollama nomic-embed-text."""

    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self._embeddings = None

    @property
    def embeddings(self) -> OllamaEmbeddings:
        if self._embeddings is None:
            self._embeddings = OllamaEmbeddings(
                model=self.model_name,
                base_url=settings.OLLAMA_BASE_URL,
            )
            logger.info(f"Embedding model loaded: {self.model_name}")
        return self._embeddings

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        try:
            return self.embeddings.embed_documents(texts)
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            raise

    def embed_query(self, query: str) -> List[float]:
        try:
            return self.embeddings.embed_query(query)
        except Exception as e:
            logger.error(f"Query embedding error: {e}")
            raise


embedding_pipeline = EmbeddingPipeline()
