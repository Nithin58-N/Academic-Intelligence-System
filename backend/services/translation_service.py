"""
Translation Service
Multilingual support for Kannada, Hindi, and English
Uses Ollama LLM for offline translation (IndicTrans2 optional)
"""

from typing import Dict, Optional

import logging
logger = logging.getLogger("academic_ai")

from rag.rag_engine import rag_engine
from utils.config import settings


class TranslationService:
    """Handles multilingual translation for academic content."""

    LANGUAGE_NAMES = {
        "en": "English",
        "hi": "Hindi (हिंदी)",
        "kn": "Kannada (ಕನ್ನಡ)",
    }

    def __init__(self):
        self._indic_model = None

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> Dict:
        """Translate text between supported languages."""
        if source_lang == target_lang:
            return {"success": True, "translated_text": text, "source": source_lang, "target": target_lang}

        try:
            # Try IndicTrans2 first (if available)
            result = await self._translate_indictrans(text, source_lang, target_lang)
            if result:
                return {
                    "success": True,
                    "translated_text": result,
                    "source": source_lang,
                    "target": target_lang,
                    "engine": "IndicTrans2",
                }
        except Exception:
            pass

        # Fallback to Ollama LLM translation
        return await self._translate_ollama(text, source_lang, target_lang)

    async def _translate_ollama(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> Dict:
        """Translate using Ollama LLM."""
        try:
            source_name = self.LANGUAGE_NAMES.get(source_lang, source_lang)
            target_name = self.LANGUAGE_NAMES.get(target_lang, target_lang)

            prompt = f"""Translate the following academic text from {source_name} to {target_name}.

Rules:
- Maintain technical terminology accuracy
- Preserve formatting (bullet points, numbering, headers)
- Keep mathematical expressions and formulas unchanged
- Use appropriate academic register
- Only output the translated text, nothing else

Text to translate:
{text}

Translation:"""

            translated = await rag_engine.generate_with_custom_prompt(
                prompt, temperature=0.1, model=settings.FAST_MODEL
            )

            return {
                "success": True,
                "translated_text": translated.strip(),
                "source": source_lang,
                "target": target_lang,
                "engine": "Ollama",
            }

        except Exception as e:
            logger.error(f"Ollama translation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "translated_text": text,
            }

    async def _translate_indictrans(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> Optional[str]:
        """Translate using IndicTrans2 model (if available)."""
        try:
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

            # IndicTrans2 language codes
            lang_codes = {
                "en": "eng_Latn",
                "hi": "hin_Deva",
                "kn": "kan_Knda",
            }

            src_code = lang_codes.get(source_lang)
            tgt_code = lang_codes.get(target_lang)

            if not src_code or not tgt_code:
                return None

            if self._indic_model is None:
                logger.info("Loading IndicTrans2 model...")
                model_name = "ai4bharat/indictrans2-en-indic-1B"
                self._indic_tokenizer = AutoTokenizer.from_pretrained(
                    model_name, trust_remote_code=True
                )
                self._indic_model = AutoModelForSeq2SeqLM.from_pretrained(
                    model_name, trust_remote_code=True
                )
                logger.info("✅ IndicTrans2 loaded")

            inputs = self._indic_tokenizer(
                text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512,
            )

            outputs = self._indic_model.generate(
                **inputs,
                num_beams=4,
                max_length=512,
            )

            translated = self._indic_tokenizer.decode(
                outputs[0], skip_special_tokens=True
            )
            return translated

        except ImportError:
            return None
        except Exception as e:
            logger.warning(f"IndicTrans2 error: {e}")
            return None

    def detect_language(self, text: str) -> str:
        """Detect language from text using Unicode ranges."""
        if not text:
            return "en"

        kannada_count = sum(1 for c in text if "\u0C80" <= c <= "\u0CFF")
        hindi_count = sum(1 for c in text if "\u0900" <= c <= "\u097F")
        total = len(text)

        if total == 0:
            return "en"

        if kannada_count / total > 0.1:
            return "kn"
        elif hindi_count / total > 0.1:
            return "hi"
        return "en"

    async def get_supported_languages(self) -> Dict:
        return {
            "languages": [
                {"code": "en", "name": "English", "native": "English"},
                {"code": "hi", "name": "Hindi", "native": "हिंदी"},
                {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ"},
            ]
        }


# Singleton instance
translation_service = TranslationService()
