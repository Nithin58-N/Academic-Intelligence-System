# 🎓 Offline Multilingual AI Academic Intelligence System

> **Powered by Ollama · RAG · Whisper · ChromaDB · Hugging Face Prompt Templates**

A fully offline, AI-powered academic assistant for engineering students supporting **Kannada**, **Hindi**, and **English**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌐 **Multilingual Chat** | Ask questions in Kannada, Hindi, or English |
| 📄 **PDF Knowledge Base** | Upload syllabi, notes, textbooks, PYQs |
| 🧠 **RAG Pipeline** | Answers grounded in your documents only |
| 🔴 **PYQ Intelligence** | Detect repeated questions, rank importance |
| 📝 **Notes Generator** | Short, detailed, revision, exam-oriented notes |
| 🎯 **Exam Prep Engine** | 1-day, 1-week, full-semester study plans |
| 🎤 **Voice Support** | Whisper STT + Piper TTS in all 3 languages |
| 🔒 **100% Offline** | No internet required after setup |
| 🚫 **Anti-Hallucination** | Only answers from uploaded documents |

---

## 🏗️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS + Framer Motion |
| UI Style | Dark Glassmorphism + Transparency Effects |
| Backend | FastAPI + Python 3.11 |
| AI Runtime | Ollama (local) |
| Main LLM | llama3:8b |
| Embeddings | nomic-embed-text |
| Vector DB | ChromaDB |
| RAG Framework | LangChain |
| Speech-to-Text | OpenAI Whisper |
| Text-to-Speech | Piper TTS |
| Translation | IndicTrans2 / Ollama fallback |
| Database | SQLite (aiosqlite) |
| Auth | JWT (python-jose) |
| PDF Parsing | PyMuPDF + pdfplumber |
| OCR | Tesseract |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.ai) installed and running
- Tesseract OCR (for scanned PDFs)

### 1. Pull Ollama Models

```bash
ollama pull llama3:8b
ollama pull phi3
ollama pull nomic-embed-text
ollama pull deepseek-coder
ollama pull gemma:7b
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
copy .env.example .env

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r ../requirements.txt

# Start backend
python main.py
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`
deployment link : https://academic-intelligence-system.onrender.com/

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down
```

---

## 📁 Project Structure

```
academic-ai/
├── frontend/                    # Next.js frontend
│   ├── app/
│   │   ├── dashboard/           # Dashboard page
│   │   ├── chat/                # AI Chat page
│   │   ├── upload/              # PDF Upload Center
│   │   ├── exam-intelligence/   # PYQ Analysis
│   │   ├── notes/               # Notes Generator
│   │   ├── voice/               # Voice Assistant
│   │   └── settings/            # Settings
│   ├── components/
│   │   └── layout/              # Sidebar, MainLayout
│   └── ...
│
├── backend/                     # FastAPI backend
│   ├── api/                     # Route handlers
│   │   ├── auth.py              # JWT authentication
│   │   ├── chat.py              # RAG chat endpoints
│   │   ├── documents.py         # PDF upload/management
│   │   ├── notes.py             # Notes generation
│   │   ├── pyq.py               # PYQ analysis
│   │   ├── speech.py            # STT/TTS
│   │   └── translation.py       # Translation
│   ├── rag/                     # RAG pipeline
│   │   ├── embeddings.py        # nomic-embed-text
│   │   ├── vector_store.py      # ChromaDB
│   │   └── rag_engine.py        # LangChain RAG
│   ├── services/                # Business logic
│   │   ├── pdf_processor.py     # PDF extraction
│   │   ├── pyq_analyzer.py      # PYQ intelligence
│   │   ├── notes_generator.py   # Notes generation
│   │   ├── speech_service.py    # Whisper + Piper
│   │   └── translation_service.py
│   ├── prompts/
│   │   └── templates.py         # HF-style prompt templates
│   ├── utils/
│   │   ├── config.py            # Settings
│   │   ├── database.py          # SQLAlchemy models
│   │   ├── auth.py              # JWT utilities
│   │   └── logger.py            # Loguru logging
│   └── main.py                  # FastAPI app entry
│
├── chroma_db/                   # Vector database (auto-created)
├── documents/                   # Uploaded PDFs (auto-created)
├── audio/                       # TTS audio files (auto-created)
├── logs/                        # Application logs (auto-created)
├── docker/                      # Docker configs
├── requirements.txt
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

### Documents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload PDF |
| GET | `/api/documents/` | List documents |
| DELETE | `/api/documents/{id}` | Delete document |
| GET | `/api/documents/stats/overview` | Statistics |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat/message` | Send message (RAG) |
| POST | `/api/chat/stream` | Stream response |
| GET | `/api/chat/sessions` | List sessions |
| GET | `/api/chat/sessions/{id}/messages` | Get messages |

### Notes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notes/generate` | Generate topic notes |
| POST | `/api/notes/answer` | Generate model answer |
| POST | `/api/notes/exam-plan` | Create study plan |
| GET | `/api/notes/saved` | List saved notes |

### PYQ Analysis
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/pyq/analyze` | Analyze PYQ papers |
| POST | `/api/pyq/predict` | Predict exam questions |
| GET | `/api/pyq/important` | Get important questions |

### Speech
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/speech/transcribe` | Audio → Text (Whisper) |
| POST | `/api/speech/synthesize` | Text → Audio (Piper) |

### Translation
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/translation/translate` | Translate text |
| GET | `/api/translation/languages` | Supported languages |

---

## 🎨 UI Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | Overview, stats, quick actions |
| AI Chat | `/chat` | Multilingual RAG chat |
| Upload Center | `/upload` | PDF upload with drag & drop |
| Exam Intelligence | `/exam-intelligence` | PYQ analysis & predictions |
| Notes Generator | `/notes` | Generate notes & answers |
| Voice Assistant | `/voice` | Voice input/output |
| Settings | `/settings` | System configuration |

---

## 🧠 Prompt Templates

The system uses Hugging Face-style prompt templates defined in `backend/prompts/templates.py`:

- **SYSTEM_PROMPT** — Main academic assistant with anti-hallucination rules
- **IMPORTANT_QUESTION_PROMPT** — PYQ pattern analysis
- **NOTES_GENERATOR_PROMPT** — Exam-oriented notes generation
- **EXAM_PREP_PROMPT** — Study plan generation
- **CONCEPT_EXPLAINER_PROMPT** — Step-by-step concept explanation

---

## 🔊 Voice Pipeline

```
User Voice → Whisper STT → Language Detection
    → RAG Retrieval → Prompt Template → Ollama LLM
    → Generated Response → Piper TTS → Audio Output
```

---

## 🌐 Supported Languages

| Language | Code | Script |
|---|---|---|
| English | `en` | Latin |
| Hindi | `hi` | Devanagari (हिंदी) |
| Kannada | `kn` | Kannada script (ಕನ್ನಡ) |

---

## 🔒 Anti-Hallucination

The system enforces strict RAG-only responses:
1. All answers retrieved from uploaded documents
2. Similarity threshold filtering (0.3 minimum)
3. Source citations included in every response
4. If no relevant content found → explicit "not available" message

---

## 📈 Development Phases

- **Phase 1** ✅ Frontend UI + PDF Upload + Ollama + Basic Chat
- **Phase 2** ✅ RAG Pipeline + ChromaDB + Semantic Retrieval
- **Phase 3** ✅ PYQ Analyzer + Notes Generator + Exam Plans
- **Phase 4** ✅ Multilingual + Whisper STT + Piper TTS
- **Phase 5** 🔄 Advanced Analytics + Optimization + Deployment

---

## 🚀 Future Expansion

- 📱 Mobile app (React Native)
- 🏫 College-wide deployment
- 👨‍🏫 Faculty dashboard
- 📝 AI-generated mock tests
- 🎤 AI viva assistant
- ✍️ Handwritten note OCR
- ☁️ Optional cloud sync
- 👥 Collaborative study rooms

---

## 📄 License

MIT License — Free for educational use.

---

**Built for engineering students. Powered by open-source AI.**
