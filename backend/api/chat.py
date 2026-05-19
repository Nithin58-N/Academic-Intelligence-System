"""Chat API Routes - RAG-powered multilingual chat"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from rag.rag_engine import rag_engine
from services.translation_service import translation_service
from utils.database import ChatMessage, ChatSession, get_db

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: Optional[str] = None
    doc_ids: Optional[List[str]] = None
    stream: bool = False


@router.post("/message")
async def chat_message(request: ChatRequest, db: Session = Depends(get_db)):
    language = request.language or translation_service.detect_language(request.message)
    session_id = request.session_id or str(uuid.uuid4())

    # Load chat history
    history = []
    if request.session_id:
        msgs = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.id.desc())
            .limit(10)
            .all()
        )
        history = [{"role": m.role, "content": m.content} for m in reversed(msgs)]

    response = await rag_engine.generate_response(
        question=request.message,
        language=language,
        chat_history=history,
        doc_ids=request.doc_ids,
    )

    # Save messages
    db.add(ChatMessage(
        session_id=session_id, role="user",
        content=request.message, language=language, sources=[],
    ))
    db.add(ChatMessage(
        session_id=session_id, role="assistant",
        content=response["answer"], language=language,
        sources=response.get("sources", []),
    ))

    # Upsert session
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        title = request.message[:50] + ("..." if len(request.message) > 50 else "")
        db.add(ChatSession(session_id=session_id, title=title, language=language))

    db.commit()

    return {
        "session_id": session_id,
        "answer": response["answer"],
        "sources": response.get("sources", []),
        "language": language,
        "model": response.get("model", "llama3:8b"),
    }


@router.post("/stream")
async def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    language = request.language or translation_service.detect_language(request.message)
    session_id = request.session_id or str(uuid.uuid4())

    history = []
    if request.session_id:
        msgs = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.id.desc())
            .limit(10)
            .all()
        )
        history = [{"role": m.role, "content": m.content} for m in reversed(msgs)]

    return StreamingResponse(
        rag_engine.stream_response(
            question=request.message,
            language=language,
            chat_history=history,
            doc_ids=request.doc_ids,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Session-ID": session_id},
    )


@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):
    sessions = (
        db.query(ChatSession)
        .order_by(ChatSession.id.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "session_id": s.session_id,
            "title": s.title,
            "language": s.language,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.id.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "language": m.language,
            "sources": m.sources,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in msgs
    ]


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.query(ChatSession).filter(ChatSession.session_id == session_id).delete()
    db.commit()
    return {"message": "Session deleted"}
