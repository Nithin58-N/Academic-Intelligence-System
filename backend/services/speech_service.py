"""
Speech Service
Whisper STT (if installed) + browser-native TTS fallback
"""

import logging
import os
import uuid
from pathlib import Path
from typing import Dict, Optional

from utils.config import settings

logger = logging.getLogger("academic_ai")


class SpeechService:
    """Handles speech-to-text and text-to-speech operations."""

    def __init__(self):
        self._whisper_model = None
        self.audio_dir = Path(settings.AUDIO_DIR)
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    def _load_whisper(self):
        """Lazy-load Whisper model if available."""
        if self._whisper_model is None:
            try:
                import whisper
                logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL}")
                self._whisper_model = whisper.load_model(settings.WHISPER_MODEL)
                logger.info("Whisper model loaded")
            except ImportError:
                logger.warning("Whisper not installed. STT unavailable.")
                return None
        return self._whisper_model

    async def transcribe_audio(
        self,
        audio_path: str,
        language: Optional[str] = None,
    ) -> Dict:
        """Transcribe audio using Whisper (if available)."""
        model = self._load_whisper()
        if model is None:
            return {
                "success": False,
                "error": "Whisper not installed. Run: pip install openai-whisper",
                "text": "",
            }

        try:
            lang_map = {"en": "en", "hi": "hi", "kn": "kn"}
            whisper_lang = lang_map.get(language) if language else None

            result = model.transcribe(
                audio_path,
                language=whisper_lang,
                task="transcribe",
                fp16=False,
            )
            text = result.get("text", "").strip()
            detected = result.get("language", "en")
            logger.info(f"Transcribed: '{text[:50]}' (lang: {detected})")
            return {"success": True, "text": text, "detected_language": detected}

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {"success": False, "error": str(e), "text": ""}

    async def text_to_speech(
        self,
        text: str,
        language: str = "en",
        voice: Optional[str] = None,
    ) -> Dict:
        """Convert text to speech. Returns a placeholder if TTS not available."""
        # Try pyttsx3 (offline, may be installed)
        try:
            import pyttsx3
            import threading

            output_filename = f"tts_{uuid.uuid4().hex[:8]}.wav"
            output_path = self.audio_dir / output_filename
            done = threading.Event()

            def run():
                try:
                    engine = pyttsx3.init()
                    engine.setProperty("rate", 150)
                    engine.save_to_file(text, str(output_path))
                    engine.runAndWait()
                except Exception as e:
                    logger.warning(f"pyttsx3 error: {e}")
                finally:
                    done.set()

            t = threading.Thread(target=run, daemon=True)
            t.start()
            t.join(timeout=20)

            if output_path.exists() and output_path.stat().st_size > 0:
                return {
                    "success": True,
                    "audio_url": f"/audio/{output_filename}",
                    "filename": output_filename,
                    "language": language,
                }
        except ImportError:
            pass
        except Exception as e:
            logger.warning(f"TTS error: {e}")

        # No TTS available — return info so frontend can use browser TTS
        return {
            "success": False,
            "error": "TTS not available server-side. Use browser speech synthesis.",
            "use_browser_tts": True,
            "text": text,
            "language": language,
        }

    def detect_language(self, text: str) -> str:
        """Detect language from Unicode ranges."""
        if not text:
            return "en"
        kannada = sum(1 for c in text if "\u0C80" <= c <= "\u0CFF")
        hindi = sum(1 for c in text if "\u0900" <= c <= "\u097F")
        total = max(len(text), 1)
        if kannada / total > 0.1:
            return "kn"
        if hindi / total > 0.1:
            return "hi"
        return "en"


speech_service = SpeechService()
