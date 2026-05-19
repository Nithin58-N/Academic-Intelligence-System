"""Speech API Routes - STT and TTS"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from services.speech_service import speech_service
from utils.config import settings

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    voice: str = None


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form(None),
):
    audio_dir = Path(settings.AUDIO_DIR)
    audio_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(audio.filename).suffix if audio.filename else ".webm"
    filename = f"input_{uuid.uuid4().hex[:8]}{suffix}"
    audio_path = audio_dir / filename

    content = await audio.read()
    with open(audio_path, "wb") as f:
        f.write(content)

    try:
        result = await speech_service.transcribe_audio(
            audio_path=str(audio_path),
            language=language,
        )
        return result
    finally:
        if audio_path.exists():
            os.remove(audio_path)


@router.post("/synthesize")
async def text_to_speech(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(request.text) > 2000:
        raise HTTPException(status_code=400, detail="Text too long (max 2000 chars)")

    result = await speech_service.text_to_speech(
        text=request.text,
        language=request.language,
        voice=request.voice,
    )
    # Return result even if TTS failed — frontend will use browser TTS
    return result


@router.post("/detect-language")
async def detect_language(text: str = Form(...)):
    language = speech_service.detect_language(text)
    names = {"en": "English", "hi": "Hindi", "kn": "Kannada"}
    return {"language": language, "language_name": names.get(language, "Unknown")}
