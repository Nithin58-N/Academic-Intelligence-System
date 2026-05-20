# Migrating Offline-College-Bot to Hybrid Grok+Ollama Architecture

## Overview

Offline-College-Bot has been migrated from **Ollama-only architecture** to a **hybrid Grok+Ollama architecture**. This allows you to:

- ✅ Use **Grok API** as the primary AI provider (recommended for production)
- ✅ Keep **Ollama** as an optional offline fallback
- ✅ Switch between providers via environment variables
- ✅ Reduce memory requirements significantly
- ✅ Improve inference reliability

---

## What Changed?

### Backend Architecture
- **Created AI Provider Abstraction Layer**
  - `backend/ai_providers/base.py` — Abstract interface
  - `backend/ai_providers/grok.py` — Grok implementation
  - `backend/ai_providers/ollama.py` — Ollama wrapper
  - `backend/ai_providers/__init__.py` — Provider factory

- **Updated RAG Engine**
  - Now uses provider abstraction instead of direct Ollama
  - Automatically switches between Grok and Ollama based on config

- **Enhanced Configuration**
  - New `AI_PROVIDER` environment variable to select provider
  - Support for `GROK_API_KEY` environment variable
  - Backward compatible with existing Ollama settings

- **Improved Health Endpoint**
  - `/api/health` now returns provider status and connectivity information

### Frontend Enhancements
- Provider status indicator in header (Grok Online / Hybrid / Offline)
- Visual indicators for provider health

### Embeddings (Unchanged)
- Still use **Ollama (nomic-embed-text)** locally
- No API calls for embeddings — keeps latency low and privacy high

---

## Setup Instructions

### Option 1: Use Grok API (Recommended)

#### Step 1: Get Grok API Key
1. Go to [https://console.x.ai](https://console.x.ai)
2. Sign up or log in to your account
3. Create an API key
4. Copy your API key

#### Step 2: Configure Environment

Create or update `.env` file in the project root:

```env
# Use Grok as primary AI provider
AI_PROVIDER=grok
GROK_API_KEY=your_grok_api_key_here
GROK_MODEL=grok-3-mini

# Keep Ollama for embeddings (local, no API calls)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MAIN_MODEL=llama3:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

#### Step 3: Install Dependencies

```bash
# Install openai package (needed for Grok)
pip install -r requirements.txt

# Or update existing installation
pip install openai>=1.40.0
```

#### Step 4: Start the Application

**Backend:**
```bash
cd backend
python -m uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

#### Step 5: Verify Setup

- Open browser to `http://localhost:3000`
- Check header for provider indicator (should show ✓ Grok Online)
- Test chat functionality
- Check `/api/health` endpoint in browser: `http://localhost:8000/api/health`

Expected response:
```json
{
  "status": "healthy",
  "system": "online",
  "provider": {
    "provider": "grok",
    "status": "online",
    "model": "grok-3-mini"
  }
}
```

---

### Option 2: Use Ollama (Local, Offline)

#### Step 1: Setup Ollama

Install Ollama from [ollama.ai](https://ollama.ai)

```bash
# Pull required models
ollama pull llama3:8b
ollama pull nomic-embed-text
ollama pull phi3

# Start Ollama server
ollama serve
```

#### Step 2: Configure Environment

Create or update `.env` file:

```env
# Use Ollama as AI provider
AI_PROVIDER=ollama

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MAIN_MODEL=llama3:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_FAST_MODEL=phi3
```

#### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 4: Start the Application

**Backend:**
```bash
cd backend
python -m uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

#### Step 5: Verify Setup

- Open browser to `http://localhost:3000`
- Check header for provider indicator (should show ↔ Hybrid or ✗ Offline if no Grok)
- Test chat functionality
- Check `/api/health`: `http://localhost:8000/api/health`

Expected response:
```json
{
  "status": "healthy",
  "system": "online",
  "provider": {
    "provider": "ollama",
    "status": "online",
    "model": "llama3:8b"
  }
}
```

---

## Switching Between Providers

You can switch between Grok and Ollama without restarting the application:

1. **Edit `.env` file:**

   Option A: Use Grok
   ```env
   AI_PROVIDER=grok
   GROK_API_KEY=your_key
   ```

   Option B: Use Ollama
   ```env
   AI_PROVIDER=ollama
   ```

2. **Restart the backend:**
   ```bash
   # Ctrl+C in backend terminal
   python -m uvicorn main:app --reload
   ```

3. **Verify in frontend:**
   - Check header indicator
   - Check `/api/health` endpoint

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                     │
│  - Chat Interface                                       │
│  - Provider Status Indicator                            │
│  - Calls /api/chat/message and /api/chat/stream         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│             FastAPI Backend                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  RAG Engine (backend/rag/rag_engine.py)           │ │
│  │  - Context Retrieval (ChromaDB)                    │ │
│  │  - Prompt Building                                 │ │
│  │  - AI Provider Abstraction                         │ │
│  └────────────────────────────────────────────────────┘ │
│                       │                                  │
│       ┌───────────────┴────────────────┐                │
│       │                                │                │
│  ┌────▼─────────────┐      ┌──────────▼────────────┐   │
│  │  Grok Provider   │      │  Ollama Provider      │   │
│  │  (OpenAI SDK)    │      │  (LangChain)          │   │
│  │  - Full Response │      │  - Streaming Support  │   │
│  │  - API-based     │      │  - Local Models       │   │
│  └────┬─────────────┘      └──────────┬────────────┘   │
│       │                               │                │
└───────┼───────────────────────────────┼────────────────┘
        │                               │
        │                               │
  ┌─────▼────────────┐          ┌──────▼─────────────┐
  │  Grok API        │          │  Ollama Server     │
  │ (api.x.ai/v1)    │          │ (localhost:11434)  │
  └──────────────────┘          └────────────────────┘
```

### Data Flow: Chat Request

```
1. User sends message in frontend
   ↓
2. Frontend calls /api/chat/message or /api/chat/stream
   ↓
3. RAG Engine retrieves relevant context from ChromaDB
   ↓
4. RAG Engine formats system prompt with context
   ↓
5. RAG Engine calls AI Provider (Grok or Ollama)
   ↓
6. Provider generates response
   ├─ If Grok: Returns full response (1-2 seconds)
   └─ If Ollama: Streams tokens in real-time
   ↓
7. Backend returns response to frontend
   ↓
8. Frontend displays message with provider indicator
```

---

## Key Features by Provider

### Grok API
- ✅ **Pros:**
  - Reduced server resource usage (no local inference)
  - Faster responses (1-2 seconds typically)
  - No GPU required
  - Good multilingual support (EN/HI/KN)
  - Production-ready reliability
  
- ⚠️ **Cons:**
  - Requires API key
  - Requires internet connection
  - May have rate limits
  - Usage costs associated with API

### Ollama (Local)
- ✅ **Pros:**
  - Works completely offline
  - No API key needed
  - No rate limits
  - No usage costs
  - Full control over models
  
- ⚠️ **Cons:**
  - Requires significant RAM (8GB+)
  - Slower inference (5-30 seconds)
  - Requires GPU for reasonable speed
  - High power consumption
  - User responsible for model management

---

## Troubleshooting

### "GROK_API_KEY not set" Error

**Problem:** You configured `AI_PROVIDER=grok` but forgot to set `GROK_API_KEY`

**Solution:**
1. Add `GROK_API_KEY=your_key` to `.env`
2. Restart backend: `python -m uvicorn main:app --reload`

### "Ollama connection failed" Error

**Problem:** `AI_PROVIDER=ollama` but Ollama server is not running

**Solution:**
1. Start Ollama: `ollama serve`
2. Verify models are pulled: `ollama list`
3. Test connection: `curl http://localhost:11434/api/tags`

### Health Endpoint Returns "offline" for Provider

**Problem:** `/api/health` shows provider status as "offline"

**Solution:**
- For Grok: Verify API key is correct and internet connection is active
- For Ollama: Verify Ollama server is running (`ollama serve`)

### Chat Returns Provider Error Message

**Problem:** Chat responses include error messages about the provider

**Solution:**
1. Check provider status: `http://localhost:8000/api/health`
2. Review backend logs for detailed error messages
3. Verify configuration in `.env`
4. Check internet connection (for Grok) or Ollama server status (for Ollama)

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | Yes | `grok` | Provider to use: `grok` or `ollama` |
| `GROK_API_KEY` | If `AI_PROVIDER=grok` | - | Your Grok API key |
| `GROK_MODEL` | No | `grok-3-mini` | Grok model to use |
| `OLLAMA_BASE_URL` | If `AI_PROVIDER=ollama` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MAIN_MODEL` | If `AI_PROVIDER=ollama` | `llama3:8b` | Main model for chat |
| `OLLAMA_EMBEDDING_MODEL` | No | `nomic-embed-text` | Model for embeddings |
| `OLLAMA_FAST_MODEL` | If `AI_PROVIDER=ollama` | `phi3` | Fast model for quick tasks |
| `REQUEST_TIMEOUT` | No | `30` | Request timeout in seconds |

---

## Next Steps

1. Choose your provider (Grok recommended for production)
2. Follow the setup instructions for your chosen provider
3. Update `.env` file with your configuration
4. Restart backend and frontend
5. Test all features:
   - Basic chat with context retrieval
   - Streaming responses
   - Notes generation
   - PYQ analysis
   - Translation (EN/HI/KN)
   - Speech input/output (if using Whisper/Piper)

---

## Monitoring

### Provider Status
- Check `/api/health` endpoint anytime to verify provider connectivity
- Frontend header shows real-time provider status

### Logs
- Backend logs (check terminal output):
  - `AI Provider initialized: GROK` or `OLLAMA`
  - Provider-specific errors will include provider name

### Metrics
- Track provider health in real-time via frontend header indicator

---

## Rolling Back to Ollama-Only

If you need to revert to Ollama-only:

1. Update `.env`:
   ```env
   AI_PROVIDER=ollama
   ```

2. Restart backend:
   ```bash
   python -m uvicorn main:app --reload
   ```

3. Verify in logs: Should show `AI Provider initialized: OLLAMA`

---

## Support & Feedback

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs for error messages
3. Verify `/api/health` endpoint
4. Check configuration in `.env`

---

## Version History

- **v1.1.0** (May 2026) — Added Grok API support, hybrid architecture
- **v1.0.0** — Ollama-only architecture
