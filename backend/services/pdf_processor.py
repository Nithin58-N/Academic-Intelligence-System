"""
PDF Processing Service
Uses pypdf + pdfplumber (both available) instead of PyMuPDF
"""

import hashlib
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pdfplumber
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from utils.config import settings

logger = logging.getLogger("academic_ai")


class PDFProcessor:
    """Processes PDF files for the RAG pipeline."""

    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )

    def extract_text_pypdf(self, file_path: str) -> Tuple[str, Dict]:
        """Extract text using pypdf."""
        reader = PdfReader(file_path)
        full_text = ""
        metadata = {
            "total_pages": len(reader.pages),
            "title": reader.metadata.get("/Title", "") if reader.metadata else "",
            "author": reader.metadata.get("/Author", "") if reader.metadata else "",
        }
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                full_text += f"\n[Page {i + 1}]\n{text}"
        return full_text, metadata

    def extract_text_pdfplumber(self, file_path: str) -> str:
        """Extract text using pdfplumber (better for tables/columns)."""
        full_text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    if text.strip():
                        full_text += f"\n[Page {i + 1}]\n{text}"
                    # Extract tables
                    for table in (page.extract_tables() or []):
                        if table:
                            rows = [
                                " | ".join(str(c) if c else "" for c in row)
                                for row in table if row
                            ]
                            full_text += "\n[Table]\n" + "\n".join(rows) + "\n"
        except Exception as e:
            logger.warning(f"pdfplumber error: {e}")
        return full_text

    def extract_with_ocr(self, file_path: str) -> str:
        """OCR fallback using pytesseract."""
        try:
            import pytesseract
            from PIL import Image
            import pypdfium2 as pdfium

            doc = pdfium.PdfDocument(file_path)
            full_text = ""
            for i in range(len(doc)):
                page = doc[i]
                bitmap = page.render(scale=2)
                pil_image = bitmap.to_pil()
                text = pytesseract.image_to_string(
                    pil_image, lang="eng+hin+kan", config="--psm 6"
                )
                if text.strip():
                    full_text += f"\n[Page {i + 1} - OCR]\n{text}"
            return full_text
        except Exception as e:
            logger.warning(f"OCR failed: {e}")
            return ""

    def clean_text(self, text: str) -> str:
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r" {2,}", " ", text)
        text = text.replace("\x00", "")
        return text.strip()

    def extract_text(self, file_path: str) -> Tuple[str, Dict]:
        """Smart extraction with fallback chain."""
        logger.info(f"Extracting text from: {Path(file_path).name}")

        # Try pypdf first
        text, metadata = self.extract_text_pypdf(file_path)

        # Fallback to pdfplumber
        if len(text.strip()) < 100:
            logger.info("Sparse text, trying pdfplumber...")
            text = self.extract_text_pdfplumber(file_path)
            if not metadata.get("total_pages"):
                try:
                    with pdfplumber.open(file_path) as pdf:
                        metadata["total_pages"] = len(pdf.pages)
                except Exception:
                    pass

        # Fallback to OCR
        if len(text.strip()) < 100:
            logger.info("Trying OCR...")
            ocr_text = self.extract_with_ocr(file_path)
            if ocr_text:
                text = ocr_text

        text = self.clean_text(text)
        logger.info(
            f"Extracted {len(text)} chars from {metadata.get('total_pages', 0)} pages"
        )
        return text, metadata

    def create_chunks(
        self,
        text: str,
        filename: str,
        doc_id: str,
        doc_type: str = "other",
        subject: str = "",
        metadata: Dict = None,
    ) -> List[Document]:
        chunks = self.text_splitter.split_text(text)
        logger.info(f"Created {len(chunks)} chunks")

        documents = []
        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue
            doc_metadata = {
                "source": filename,
                "doc_id": doc_id,
                "doc_type": doc_type,
                "subject": subject,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "page": self._estimate_page(chunk),
            }
            if metadata:
                for k, v in metadata.items():
                    if k not in doc_metadata and v:
                        doc_metadata[k] = v
            documents.append(Document(page_content=chunk, metadata=doc_metadata))

        return documents

    def _estimate_page(self, chunk: str) -> int:
        match = re.search(r"\[Page (\d+)\]", chunk)
        return int(match.group(1)) if match else 0

    def generate_doc_id(self, file_path: str) -> str:
        try:
            with open(file_path, "rb") as f:
                return hashlib.md5(f.read()).hexdigest()[:16]
        except Exception:
            return hashlib.md5(file_path.encode()).hexdigest()[:16]

    async def process_pdf(
        self,
        file_path: str,
        filename: str,
        doc_type: str = "other",
        subject: str = "",
    ) -> Dict:
        try:
            doc_id = self.generate_doc_id(file_path)
            text, metadata = self.extract_text(file_path)

            if not text.strip():
                return {
                    "success": False,
                    "error": "Could not extract text from PDF",
                    "doc_id": doc_id,
                }

            chunks = self.create_chunks(
                text=text,
                filename=filename,
                doc_id=doc_id,
                doc_type=doc_type,
                subject=subject,
                metadata=metadata,
            )

            return {
                "success": True,
                "doc_id": doc_id,
                "chunks": chunks,
                "total_chunks": len(chunks),
                "total_pages": metadata.get("total_pages", 0),
                "text_length": len(text),
                "metadata": {k: v for k, v in metadata.items() if isinstance(v, (str, int, float))},
            }

        except Exception as e:
            logger.error(f"PDF processing error: {e}")
            return {"success": False, "error": str(e), "doc_id": ""}


pdf_processor = PDFProcessor()
