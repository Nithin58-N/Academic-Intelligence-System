"""Notes Generation API Routes"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.notes_generator import notes_generator
from utils.database import GeneratedNote, get_db

router = APIRouter()


class NotesRequest(BaseModel):
    topic: str
    subject: str
    note_type: str = "detailed"
    language: str = "en"
    doc_ids: Optional[List[str]] = None


class SubjectNotesRequest(BaseModel):
    subject: str
    note_type: str = "revision"
    language: str = "en"
    doc_ids: Optional[List[str]] = None


class ExamPlanRequest(BaseModel):
    subject: str
    plan_type: str = "one_week"
    available_hours: int = 40
    weak_topics: str = ""
    doc_ids: Optional[List[str]] = None


class AnswerRequest(BaseModel):
    question: str
    answer_type: str = "5mark"
    subject: str = ""
    language: str = "en"
    doc_ids: Optional[List[str]] = None


@router.post("/generate")
async def generate_notes(request: NotesRequest, db: Session = Depends(get_db)):
    result = await notes_generator.generate_notes(
        topic=request.topic,
        subject=request.subject,
        note_type=request.note_type,
        language=request.language,
        doc_ids=request.doc_ids,
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))

    note = GeneratedNote(
        title=f"{request.note_type.title()} Notes: {request.topic}",
        content=result["content"],
        note_type=request.note_type,
        subject=request.subject,
        language=request.language,
        document_ids=request.doc_ids or [],
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    result["note_id"] = note.id
    return result


@router.post("/subject")
async def generate_subject_notes(request: SubjectNotesRequest):
    result = await notes_generator.generate_subject_notes(
        subject=request.subject,
        note_type=request.note_type,
        language=request.language,
        doc_ids=request.doc_ids,
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.post("/exam-plan")
async def generate_exam_plan(request: ExamPlanRequest):
    result = await notes_generator.generate_exam_plan(
        subject=request.subject,
        plan_type=request.plan_type,
        available_hours=request.available_hours,
        weak_topics=request.weak_topics,
        doc_ids=request.doc_ids,
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.post("/answer")
async def generate_answer(request: AnswerRequest):
    result = await notes_generator.generate_answer(
        question=request.question,
        answer_type=request.answer_type,
        subject=request.subject,
        language=request.language,
        doc_ids=request.doc_ids,
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.get("/saved")
def get_saved_notes(db: Session = Depends(get_db)):
    notes = db.query(GeneratedNote).order_by(GeneratedNote.id.desc()).limit(50).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "note_type": n.note_type,
            "subject": n.subject,
            "language": n.language,
            "word_count": len(n.content.split()) if n.content else 0,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notes
    ]


@router.get("/saved/{note_id}")
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(GeneratedNote).filter(GeneratedNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "note_type": note.note_type,
        "subject": note.subject,
        "language": note.language,
        "created_at": note.created_at.isoformat() if note.created_at else None,
    }
