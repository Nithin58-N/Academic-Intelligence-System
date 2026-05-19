"""
Previous Year Question (PYQ) Analyzer
Detects repeated questions, ranks importance, predicts exam questions
"""

import json
import re
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Tuple

import numpy as np
import logging
logger = logging.getLogger("academic_ai")
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from prompts.templates import IMPORTANT_QUESTION_PROMPT
from rag.rag_engine import rag_engine
from rag.vector_store import vector_store
from utils.config import settings


class PYQAnalyzer:
    """Analyzes previous year question papers for patterns and importance."""

    def __init__(self):
        self.tfidf = TfidfVectorizer(
            max_features=5000,
            stop_words="english",
            ngram_range=(1, 2),
        )

    def extract_questions(self, text: str) -> List[Dict]:
        """Extract individual questions from PYQ text."""
        questions = []

        # Pattern matching for common question formats
        patterns = [
            r"(?:Q\.?\s*\d+[a-z]?\.?\s*)(.*?)(?=Q\.?\s*\d+[a-z]?\.?|\Z)",
            r"(?:\d+\.\s*)(.*?)(?=\d+\.|\Z)",
            r"(?:[a-z]\)\s*)(.*?)(?=[a-z]\)|\Z)",
        ]

        # Try to extract marks info
        marks_pattern = r"\[(\d+)\s*(?:marks?|M)\]|\((\d+)\s*(?:marks?|M)\)"

        for pattern in patterns:
            matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
            if len(matches) > 3:  # Found meaningful questions
                for match in matches:
                    q_text = match.strip()
                    if len(q_text) > 20:  # Filter out very short matches
                        marks_match = re.search(marks_pattern, q_text)
                        marks = int(marks_match.group(1) or marks_match.group(2)) if marks_match else 5

                        questions.append({
                            "text": re.sub(marks_pattern, "", q_text).strip(),
                            "marks": marks,
                            "raw": q_text,
                        })
                break

        # Fallback: split by newlines and filter
        if not questions:
            lines = text.split("\n")
            for line in lines:
                line = line.strip()
                if len(line) > 30 and any(
                    line.lower().startswith(kw)
                    for kw in ["what", "explain", "describe", "define", "discuss",
                               "compare", "differentiate", "write", "list", "state",
                               "derive", "prove", "find", "calculate", "solve"]
                ):
                    questions.append({"text": line, "marks": 5, "raw": line})

        return questions

    def find_similar_questions(
        self,
        questions: List[str],
        threshold: float = 0.7,
    ) -> List[List[int]]:
        """Group similar questions using TF-IDF cosine similarity."""
        if len(questions) < 2:
            return [[i] for i in range(len(questions))]

        try:
            tfidf_matrix = self.tfidf.fit_transform(questions)
            similarity_matrix = cosine_similarity(tfidf_matrix)

            # Group similar questions
            visited = set()
            groups = []

            for i in range(len(questions)):
                if i in visited:
                    continue
                group = [i]
                visited.add(i)
                for j in range(i + 1, len(questions)):
                    if j not in visited and similarity_matrix[i][j] >= threshold:
                        group.append(j)
                        visited.add(j)
                groups.append(group)

            return groups
        except Exception as e:
            logger.warning(f"Similarity computation failed: {e}")
            return [[i] for i in range(len(questions))]

    def calculate_importance_score(
        self,
        frequency: int,
        marks: int,
        total_papers: int,
    ) -> float:
        """Calculate importance score for a question."""
        freq_score = min(frequency / max(total_papers, 1), 1.0) * 50
        marks_score = min(marks / 10, 1.0) * 30
        recency_bonus = 20 if frequency > 1 else 0
        return round(freq_score + marks_score + recency_bonus, 2)

    def categorize_question(self, score: float) -> str:
        """Categorize question by importance score."""
        if score >= 70:
            return "very_important"
        elif score >= 40:
            return "important"
        else:
            return "practice"

    def extract_module(self, question_text: str) -> str:
        """Try to identify which module a question belongs to."""
        module_keywords = {
            "Module 1": ["introduction", "basic", "fundamental", "overview", "history"],
            "Module 2": ["algorithm", "data structure", "array", "linked list", "stack", "queue"],
            "Module 3": ["tree", "graph", "sorting", "searching", "hashing"],
            "Module 4": ["network", "protocol", "communication", "transmission"],
            "Module 5": ["advanced", "application", "case study", "implementation"],
        }

        text_lower = question_text.lower()
        for module, keywords in module_keywords.items():
            if any(kw in text_lower for kw in keywords):
                return module
        return "General"

    async def analyze_pyq_documents(
        self,
        doc_ids: Optional[List[str]] = None,
    ) -> Dict:
        """Full PYQ analysis pipeline."""
        try:
            logger.info("Starting PYQ analysis...")

            # Retrieve all PYQ content
            results = vector_store.similarity_search(
                query="question marks exam previous year",
                k=50,
                filter_doc_ids=doc_ids,
            )

            if not results:
                return {
                    "success": False,
                    "error": "No PYQ documents found. Please upload previous year question papers.",
                }

            # Collect all text
            all_text = "\n".join([doc.page_content for doc, _ in results])

            # Extract questions
            raw_questions = self.extract_questions(all_text)
            logger.info(f"Extracted {len(raw_questions)} raw questions")

            if not raw_questions:
                # Use LLM to analyze
                context = vector_store.format_context(results)
                prompt = IMPORTANT_QUESTION_PROMPT.format(context=context)
                llm_analysis = await rag_engine.generate_with_custom_prompt(prompt)
                return {
                    "success": True,
                    "llm_analysis": llm_analysis,
                    "questions": [],
                    "stats": {"total_questions": 0},
                }

            # Find similar/repeated questions
            question_texts = [q["text"] for q in raw_questions]
            groups = self.find_similar_questions(question_texts)

            # Build analyzed questions
            analyzed_questions = []
            total_papers = max(1, len(set(
                doc.metadata.get("source", "") for doc, _ in results
            )))

            for group in groups:
                # Representative question (longest in group)
                rep_idx = max(group, key=lambda i: len(question_texts[i]))
                rep_question = raw_questions[rep_idx]

                frequency = len(group)
                marks = rep_question.get("marks", 5)
                score = self.calculate_importance_score(frequency, marks, total_papers)
                category = self.categorize_question(score)
                module = self.extract_module(rep_question["text"])

                analyzed_questions.append({
                    "question": rep_question["text"],
                    "frequency": frequency,
                    "marks": marks,
                    "importance_score": score,
                    "category": category,
                    "module": module,
                    "similar_count": len(group) - 1,
                    "category_label": {
                        "very_important": "🔴 Very Important",
                        "important": "🟡 Important",
                        "practice": "🟢 Practice",
                    }.get(category, "🟢 Practice"),
                })

            # Sort by importance score
            analyzed_questions.sort(key=lambda x: x["importance_score"], reverse=True)

            # Topic frequency analysis
            all_words = " ".join(question_texts).lower()
            word_freq = Counter(
                word for word in all_words.split()
                if len(word) > 4 and word not in {
                    "what", "explain", "describe", "define", "discuss",
                    "write", "short", "note", "with", "example", "brief"
                }
            )
            top_topics = [{"topic": word, "count": count}
                         for word, count in word_freq.most_common(15)]

            # Module distribution
            module_dist = Counter(q["module"] for q in analyzed_questions)

            stats = {
                "total_questions": len(analyzed_questions),
                "very_important": sum(1 for q in analyzed_questions if q["category"] == "very_important"),
                "important": sum(1 for q in analyzed_questions if q["category"] == "important"),
                "practice": sum(1 for q in analyzed_questions if q["category"] == "practice"),
                "repeated_questions": sum(1 for q in analyzed_questions if q["frequency"] > 1),
                "top_topics": top_topics,
                "module_distribution": dict(module_dist),
            }

            logger.info(f"✅ PYQ analysis complete: {stats['total_questions']} questions analyzed")

            return {
                "success": True,
                "questions": analyzed_questions,
                "stats": stats,
                "very_important": [q for q in analyzed_questions if q["category"] == "very_important"],
                "important": [q for q in analyzed_questions if q["category"] == "important"],
                "practice": [q for q in analyzed_questions if q["category"] == "practice"],
            }

        except Exception as e:
            logger.error(f"PYQ analysis error: {e}")
            return {"success": False, "error": str(e)}

    async def predict_questions(
        self,
        subject: str,
        doc_ids: Optional[List[str]] = None,
    ) -> List[Dict]:
        """Predict likely exam questions based on patterns."""
        try:
            results = vector_store.similarity_search(
                query=f"important questions {subject} exam",
                k=20,
                filter_doc_ids=doc_ids,
            )

            context = vector_store.format_context(results)
            prompt = f"""Based on the following previous year questions and study material for {subject},
predict the 10 most likely questions for the upcoming exam.

For each predicted question:
1. State the question clearly
2. Explain why it's likely to appear (based on frequency/importance)
3. Suggest the answer format (2-mark/5-mark/10-mark)
4. Rate confidence: High/Medium/Low

Context:
{context}

Provide predictions in a structured format."""

            predictions_text = await rag_engine.generate_with_custom_prompt(prompt)

            return [{
                "predictions": predictions_text,
                "subject": subject,
                "based_on_chunks": len(results),
            }]

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return []


# Singleton instance
pyq_analyzer = PYQAnalyzer()
