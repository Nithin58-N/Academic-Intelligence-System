"""PYQ Analysis API Routes"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.pyq_analyzer import pyq_analyzer

router = APIRouter()


class PYQAnalysisRequest(BaseModel):
    doc_ids: Optional[List[str]] = None
    subject: str = ""


class PredictionRequest(BaseModel):
    subject: str
    doc_ids: Optional[List[str]] = None


@router.post("/analyze")
async def analyze_pyq(request: PYQAnalysisRequest):
    result = await pyq_analyzer.analyze_pyq_documents(doc_ids=request.doc_ids)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "PYQ analysis failed"))
    return result


@router.post("/predict")
async def predict_questions(request: PredictionRequest):
    if not request.subject:
        raise HTTPException(status_code=400, detail="Subject is required")
    predictions = await pyq_analyzer.predict_questions(
        subject=request.subject,
        doc_ids=request.doc_ids,
    )
    return {"success": True, "subject": request.subject, "predictions": predictions}


@router.get("/important")
async def get_important_questions(
    subject: Optional[str] = None,
    category: Optional[str] = None,
):
    result = await pyq_analyzer.analyze_pyq_documents()
    if not result.get("success"):
        return {"questions": [], "message": "No PYQ data available"}

    questions = result.get("questions", [])
    if category:
        questions = [q for q in questions if q.get("category") == category]
    if subject:
        questions = [q for q in questions if subject.lower() in q.get("question", "").lower()]

    return {"questions": questions[:50], "total": len(questions), "stats": result.get("stats", {})}
