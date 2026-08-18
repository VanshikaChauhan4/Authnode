# AuthNode

Certificate verification webapp — issue tamper-evident credentials, verify with a QR scan, and ask the RAG assistant in plain language.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite (port **5173**) |
| API | Python FastAPI + SQLite + RSA signing (port **5000**) |
| Chatbot | LangChain RAG + Chroma + Ollama (port **8000**) |

## Quick start

### 1. Certificate API (required)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python run.py
```

Health check: http://localhost:5000/health

### 2. Frontend (required)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 3. Chatbot (optional but recommended)

Install [Ollama](https://ollama.com/download), then:

```bash
ollama pull llama3.1:8b
ollama serve
```

In another terminal:

```bash
cd chatbot-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python ingest.py
python app.py
```

The chatbot falls back to retrieval-only answers if Ollama is not running.

## User flows

1. **Institution** — Sign in → Issue → certificate secured with fingerprint + RSA signature → QR code
2. **Student** — Sign in with the same name on the certificate → Dashboard → share QR/link
3. **Employer** — Verify page → paste or scan ID → Verified / Could not verify

## How signing works

1. Canonical string built from student, course, institution, date
2. SHA-256 fingerprint computed
3. Institution RSA private key signs the fingerprint at issue time
4. Verification recomputes fingerprint and checks RSA signature against institution public key

Data is stored in `backend/authnode.db`.

## Project layout

```
frontend/          React UI
backend/           FastAPI + SQLite certificate API
chatbot-service/   RAG assistant (FAQ/workflow docs)
```
