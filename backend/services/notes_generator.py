"""
Smart Notes Generator
Generates exam-oriented notes in multiple formats and languages
"""

from typing import Dict, List, Optional

import logging
logger = logging.getLogger("academic_ai")

from prompts.templates import NOTES_GENERATOR_PROMPT, EXAM_PREP_PROMPT
from rag.rag_engine import rag_engine
from rag.vector_store import vector_store
from utils.config import settings


class NotesGenerator:
    """Generates various types of study notes from uploaded documents."""

    NOTE_TYPES = {
        "short": "Short notes with key definitions and 2-mark answers",
        "detailed": "Comprehensive notes with full explanations",
        "revision": "Quick revision bullet points for last-minute study",
        "exam": "Exam-oriented notes with tips and important points",
        "2mark": "2-mark answer format notes",
        "5mark": "5-mark answer format notes",
        "10mark": "10-mark answer format notes",
    }

    async def generate_notes(
        self,
        topic: str,
        subject: str,
        note_type: str = "detailed",
        language: str = "en",
        doc_ids: Optional[List[str]] = None,
    ) -> Dict:
        """Generate notes for a specific topic."""
        try:
            logger.info(f"Generating {note_type} notes for: {topic}")

            # Retrieve relevant context
            results = vector_store.similarity_search(
                query=f"{topic} {subject}",
                k=8,
                filter_doc_ids=doc_ids,
            )

            if not results:
                return {
                    "success": False,
                    "error": f"No relevant content found for '{topic}'. Please upload relevant documents first.",
                }

            context = vector_store.format_context(results)

            # Build notes prompt
            prompt = NOTES_GENERATOR_PROMPT.format(
                context=context,
                note_type=note_type,
                subject=subject,
                topic=topic,
                language=self._get_language_name(language),
            )

            # Add specific format instructions
            prompt += self._get_format_instructions(note_type)

            notes_content = await rag_engine.generate_with_custom_prompt(
                prompt, temperature=0.2
            )

            sources = [
                {
                    "source": doc.metadata.get("source", "Unknown"),
                    "page": doc.metadata.get("page", 0),
                }
                for doc, _ in results
            ]

            return {
                "success": True,
                "topic": topic,
                "subject": subject,
                "note_type": note_type,
                "language": language,
                "content": notes_content,
                "sources": sources,
                "word_count": len(notes_content.split()),
            }

        except Exception as e:
            logger.error(f"Notes generation error: {e}")
            return {"success": False, "error": str(e)}

    async def generate_subject_notes(
        self,
        subject: str,
        note_type: str = "revision",
        language: str = "en",
        doc_ids: Optional[List[str]] = None,
    ) -> Dict:
        """Generate comprehensive notes for an entire subject."""
        try:
            # Get all content for the subject
            results = vector_store.similarity_search(
                query=f"{subject} complete syllabus topics concepts",
                k=15,
                filter_doc_ids=doc_ids,
            )

            if not results:
                return {
                    "success": False,
                    "error": f"No content found for subject: {subject}",
                }

            context = vector_store.format_context(results)

            prompt = f"""Generate comprehensive {note_type} notes for the subject: {subject}

Language: {self._get_language_name(language)}

Requirements:
- Cover all major topics found in the source material
- Organize by modules/units
- Include definitions, key concepts, and formulas
- Add exam tips for each section
- Format with clear headings and bullet points
- Suitable for engineering semester exam preparation

Source Material:
{context}

Generate well-structured, exam-ready notes:"""

            content = await rag_engine.generate_with_custom_prompt(prompt, temperature=0.2)

            return {
                "success": True,
                "subject": subject,
                "note_type": note_type,
                "language": language,
                "content": content,
                "sources": [doc.metadata.get("source") for doc, _ in results],
                "chunks_used": len(results),
            }

        except Exception as e:
            logger.error(f"Subject notes error: {e}")
            return {"success": False, "error": str(e)}

    async def generate_exam_plan(
        self,
        subject: str,
        plan_type: str = "one_week",
        available_hours: int = 40,
        weak_topics: str = "",
        doc_ids: Optional[List[str]] = None,
    ) -> Dict:
        """Generate an exam preparation plan."""
        try:
            results = vector_store.similarity_search(
                query=f"{subject} syllabus modules topics",
                k=10,
                filter_doc_ids=doc_ids,
            )

            context = vector_store.format_context(results) if results else "No syllabus uploaded."

            prompt = EXAM_PREP_PROMPT.format(
                context=context,
                plan_type=plan_type,
                subject=subject,
                available_hours=available_hours,
                weak_topics=weak_topics or "Not specified",
            )

            plan_content = await rag_engine.generate_with_custom_prompt(
                prompt, temperature=0.3
            )

            return {
                "success": True,
                "subject": subject,
                "plan_type": plan_type,
                "available_hours": available_hours,
                "content": plan_content,
            }

        except Exception as e:
            logger.error(f"Exam plan error: {e}")
            return {"success": False, "error": str(e)}

    async def generate_answer(
        self,
        question: str,
        answer_type: str = "5mark",
        subject: str = "",
        language: str = "en",
        doc_ids: Optional[List[str]] = None,
    ) -> Dict:
        """Generate a model answer for a specific question."""
        try:
            results = vector_store.similarity_search(
                query=question,
                k=6,
                filter_doc_ids=doc_ids,
            )

            context = vector_store.format_context(results) if results else ""

            marks_map = {"2mark": 2, "5mark": 5, "10mark": 10}
            marks = marks_map.get(answer_type, 5)

            prompt = f"""Generate a model {marks}-mark answer for the following question.

Question: {question}
Subject: {subject}
Answer Format: {marks}-mark answer
Language: {self._get_language_name(language)}

Answer Requirements:
- Appropriate length for {marks} marks
- Clear structure with introduction, body, conclusion
- Include relevant definitions, explanations, examples
- Use bullet points where appropriate
- Add diagrams description if relevant
- Include key terms that examiners look for

Source Material:
{context}

Generate the model answer:"""

            answer = await rag_engine.generate_with_custom_prompt(prompt, temperature=0.1)

            return {
                "success": True,
                "question": question,
                "answer_type": answer_type,
                "marks": marks,
                "language": language,
                "answer": answer,
                "sources": [doc.metadata.get("source") for doc, _ in results],
            }

        except Exception as e:
            logger.error(f"Answer generation error: {e}")
            return {"success": False, "error": str(e)}

    def _get_language_name(self, lang_code: str) -> str:
        names = {"en": "English", "hi": "Hindi (हिंदी)", "kn": "Kannada (ಕನ್ನಡ)"}
        return names.get(lang_code, "English")

    def _get_format_instructions(self, note_type: str) -> str:
        instructions = {
            "short": "\n\nFormat: Brief definitions and key points only. Max 200 words per topic.",
            "detailed": "\n\nFormat: Full explanations with examples. Include all relevant details.",
            "revision": "\n\nFormat: Bullet points only. Quick-scan format. Max 5 bullets per topic.",
            "exam": "\n\nFormat: Include 'EXAM TIP:' sections. Highlight frequently asked concepts.",
            "2mark": "\n\nFormat: Definition + 1-2 key points. Exactly 2-mark answer length.",
            "5mark": "\n\nFormat: Definition + explanation + example + key points. 5-mark length.",
            "10mark": "\n\nFormat: Full essay format with introduction, detailed explanation, diagrams description, applications, conclusion.",
        }
        return instructions.get(note_type, "")


# Singleton instance
notes_generator = NotesGenerator()
