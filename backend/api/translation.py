"""Translation API Routes"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.translation_service import translation_service

router = APIRouter()


class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "en"
    target_lang: str = "hi"


@router.post("/translate")
async def translate_text(request: TranslationRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if request.source_lang not in ["en", "hi", "kn"]:
        raise HTTPException(status_code=400, detail="Unsupported source language")
    if request.target_lang not in ["en", "hi", "kn"]:
        raise HTTPException(status_code=400, detail="Unsupported target language")

    result = await translation_service.translate(
        text=request.text,
        source_lang=request.source_lang,
        target_lang=request.target_lang,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Translation failed"))
    return result


@router.get("/languages")
async def get_languages():
    return await translation_service.get_supported_languages()


@router.post("/detect")
async def detect_language(text: str):
    lang = translation_service.detect_language(text)
    names = {"en": "English", "hi": "Hindi", "kn": "Kannada"}
    return {"language": lang, "name": names.get(lang, "Unknown")}
