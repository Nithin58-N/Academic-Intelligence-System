"""
ChromaDB Vector Store Management
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import logging
logger = logging.getLogger("academic_ai")

from rag.embeddings import embedding_pipeline
from utils.config import settings


class VectorStore:
    """ChromaDB vector store for semantic document retrieval."""

    def __init__(self):
        self.persist_dir = settings.CHROMA_DIR
        self.collection_name = settings.CHROMA_COLLECTION
        self._store: Optional[Chroma] = None
        self._client: Optional[chromadb.PersistentClient] = None

    def _get_client(self) -> chromadb.PersistentClient:
        if self._client is None:
            Path(self.persist_dir).mkdir(parents=True, exist_ok=True)
            self._client = chromadb.PersistentClient(
                path=self.persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        return self._client

    def get_store(self) -> Chroma:
        """Get or create the Chroma vector store."""
        if self._store is None:
            self._store = Chroma(
                client=self._get_client(),
                collection_name=self.collection_name,
                embedding_function=embedding_pipeline.embeddings,
            )
            logger.info(f"✅ ChromaDB store ready: {self.collection_name}")
        return self._store

    def add_documents(
        self,
        documents: List[Document],
        doc_id: str,
    ) -> int:
        """Add documents to the vector store."""
        try:
            store = self.get_store()

            # Tag each document with source doc_id
            for doc in documents:
                doc.metadata["doc_id"] = doc_id

            store.add_documents(documents)
            logger.info(f"✅ Added {len(documents)} chunks for doc_id={doc_id}")
            return len(documents)
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            raise

    def similarity_search(
        self,
        query: str,
        k: int = None,
        filter_doc_ids: Optional[List[str]] = None,
    ) -> List[Tuple[Document, float]]:
        """Perform semantic similarity search."""
        k = k or settings.TOP_K_RESULTS
        try:
            store = self.get_store()

            search_kwargs = {"k": k}
            if filter_doc_ids:
                search_kwargs["filter"] = {"doc_id": {"$in": filter_doc_ids}}

            results = store.similarity_search_with_relevance_scores(
                query, **search_kwargs
            )

            # Filter by threshold
            filtered = [
                (doc, score)
                for doc, score in results
                if score >= settings.SIMILARITY_THRESHOLD
            ]

            logger.info(f"Found {len(filtered)} relevant chunks for query")
            return filtered
        except Exception as e:
            logger.error(f"Similarity search error: {e}")
            return []

    def delete_document(self, doc_id: str) -> bool:
        """Delete all chunks for a document."""
        try:
            client = self._get_client()
            collection = client.get_collection(self.collection_name)
            collection.delete(where={"doc_id": doc_id})
            logger.info(f"✅ Deleted chunks for doc_id={doc_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return False

    def get_collection_stats(self) -> Dict:
        """Get statistics about the vector store."""
        try:
            client = self._get_client()
            collection = client.get_collection(self.collection_name)
            count = collection.count()
            return {"total_chunks": count, "collection": self.collection_name}
        except Exception as e:
            logger.error(f"Stats error: {e}")
            return {"total_chunks": 0, "collection": self.collection_name}

    def format_context(self, results: List[Tuple[Document, float]]) -> str:
        """Format retrieved documents into context string."""
        if not results:
            return "No relevant documents found."

        context_parts = []
        for i, (doc, score) in enumerate(results, 1):
            source = doc.metadata.get("source", "Unknown")
            page = doc.metadata.get("page", "?")
            context_parts.append(
                f"[Source {i}: {source}, Page {page}, Relevance: {score:.2f}]\n{doc.page_content}"
            )

        return "\n\n---\n\n".join(context_parts)


# Singleton instance
vector_store = VectorStore()
