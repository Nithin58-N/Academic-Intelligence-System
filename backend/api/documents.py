"""Document Upload and Management API Routes"""

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from rag.vector_store import vector_store
from services.pdf_processor import pdf_processor
from utils.config import settings
from utils.database import Document, get_db

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("other"),
    subject: str = Form(""),
    semester: str = Form(""),
    db: Session = Depends(get_db),
):
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB}MB")

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = upload_dir / safe_filename

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        filename=safe_filename,
        original_name=file.filename,
        file_path=str(file_path),
        file_size=len(content),
        doc_type=doc_type,
        subject=subject,
        semester=semester,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        result = await pdf_processor.process_pdf(
            file_path=str(file_path),
            filename=file.filename,
            doc_type=doc_type,
            subject=subject,
        )

        if result["success"]:
            chunks_added = vector_store.add_documents(
                documents=result["chunks"],
                doc_id=result["doc_id"],
            )
            doc.status = "indexed"
            doc.total_pages = result.get("total_pages", 0)
            doc.total_chunks = chunks_added
            doc.metadata_json = result.get("metadata", {})
            db.commit()

            return {
                "success": True,
                "document_id": doc.id,
                "doc_id": result["doc_id"],
                "filename": file.filename,
                "total_pages": result.get("total_pages", 0),
                "total_chunks": chunks_added,
                "status": "indexed",
                "message": f"Successfully processed and indexed {file.filename}",
            }
        else:
            doc.status = "failed"
            db.commit()
            raise HTTPException(status_code=500, detail=f"PDF processing failed: {result.get('error')}")

    except HTTPException:
        raise
    except Exception as e:
        doc.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.get("/")
def list_documents(
    doc_type: Optional[str] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Document).order_by(Document.id.desc())
    if doc_type:
        query = query.filter(Document.doc_type == doc_type)
    documents = query.all()

    if subject:
        documents = [d for d in documents if d.subject and subject.lower() in d.subject.lower()]

    return [
        {
            "id": d.id,
            "filename": d.original_name,
            "doc_type": d.doc_type,
            "subject": d.subject,
            "semester": d.semester,
            "total_pages": d.total_pages,
            "total_chunks": d.total_chunks,
            "status": d.status,
            "file_size": d.file_size,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in documents
    ]


@router.get("/stats/overview")
def get_stats(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    vector_stats = vector_store.get_collection_stats()
    by_type: dict = {}
    for d in documents:
        if d.doc_type:
            by_type[d.doc_type] = by_type.get(d.doc_type, 0) + 1

    return {
        "total_documents": len(documents),
        "indexed_documents": sum(1 for d in documents if d.status == "indexed"),
        "total_pages": sum(d.total_pages or 0 for d in documents),
        "total_chunks": vector_stats.get("total_chunks", 0),
        "by_type": by_type,
    }


@router.get("/{doc_id}")
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "filename": doc.original_name,
        "doc_type": doc.doc_type,
        "subject": doc.subject,
        "semester": doc.semester,
        "total_pages": doc.total_pages,
        "total_chunks": doc.total_chunks,
        "status": doc.status,
        "file_size": doc.file_size,
        "metadata": doc.metadata_json,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if Path(doc.file_path).exists():
        doc_hash = pdf_processor.generate_doc_id(doc.file_path)
        vector_store.delete_document(doc_hash)
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    return {"message": f"Document '{doc.original_name}' deleted"}
