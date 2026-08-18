# AuthNode Assistant — chatbot-service

A LangChain + RAG chatbot for the AuthNode certificate platform. It answers questions
about issuing, sharing, and verifying certificates, grounded in AuthNode's own
documentation — not general knowledge, and never invented functionality.

## What it does

- Retrieves relevant AuthNode documentation for each question (RAG, not a hardcoded
  prompt)
- Runs entirely free/local: HuggingFace `sentence-transformers` for embeddings, Ollama
  for the LLM, Chroma for the vector store — no API keys, no cost
- Remembers conversation history per session and rewrites follow-up questions
  ("why does it use that?") into standalone retrieval queries
- Refuses to answer out-of-domain questions (politely redirects instead of guessing)
- Refuses to invent AuthNode features that aren't in the docs
- Returns source citations with every grounded answer
- Rate-limited, input-validated, and never leaks stack traces to the client

## Architecture

```
User
 |
 v
AuthNode Chatbot UI (ChatWidget.jsx)
 |
 v
POST /api/chat  (FastAPI)
 |
 v
Query rewriting (uses session history for follow-ups)
 |
 v
Intent detection  -->  soft category filter on retrieval
 |
 v
Retriever (Chroma, HuggingFace embeddings)
 |
 v
Relevance gate  -- below threshold --> polite out-of-domain reply, LLM not called
 |
 v (above threshold)
LLM (Ollama, local) grounded on retrieved AuthNode docs
 |
 v
Answer + source citations + sessionId
```

## Knowledge base

All source documents live in `data/*.md`. Each is tagged with metadata in
`ingest.py`'s `DOC_METADATA` (title, category, audience) used for citations and
retrieval biasing.

| File | Covers |
|---|---|
| `authnode-overview.md` | What AuthNode is, the problem it solves |
| `certificate-generation.md` | How institutions issue certificates |
| `certificate-verification.md` | How verification works, the three result states |
| `student-guide.md` | Student workflow: finding, sharing certificates |
| `institute-guide.md` | Institution workflow: issuing, what's stored |
| `verifier-guide.md` | Employer/verifier workflow |
| `security-and-trust.md` | SHA-256 fingerprinting, RSA signatures, honest note on blockchain/IPFS (not currently used) |
| `authnode-benefits.md` | Why AuthNode vs. a plain PDF |
| `faq.md` | Common questions |
| `troubleshooting.md` | Common verification issues |
| `chatbot-scope.md` | What this assistant can/can't help with |
| `roadmap.md` | What's in this demo vs. planned |

**Important:** this documentation describes AuthNode's *actual current implementation*
(SQLite + SHA-256 + RSA signatures). It deliberately does **not** claim blockchain or
IPFS are in use today, since they aren't — they're listed in `roadmap.md` as future
work. If you add blockchain/IPFS support later, update `security-and-trust.md` and
`roadmap.md` to match, and re-run ingestion.

## Environment variables

Copy `.env.example` to `.env` and adjust as needed. Nothing is hardcoded — see that
file for every variable and what it controls (model name, vector store path, CORS
origins, retrieval settings, rate limit).

## Installation

```bash
cd chatbot-service
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

You'll also need [Ollama](https://ollama.com) installed and a model pulled:

```bash
ollama pull llama3.1:8b
ollama serve
```

## Running locally

```bash
python ingest.py      # builds the vector store from data/*.md (also runs automatically on first request if skipped)
python app.py          # or: uvicorn app:app --reload --port 8000
```

The service runs on `http://localhost:8000` by default.

## API

### `POST /api/chat`

```json
{
  "message": "How does AuthNode verify a certificate?",
  "sessionId": "optional-existing-session-id"
}
```

```json
{
  "answer": "AuthNode verifies a certificate by...",
  "sources": [
    { "title": "Certificate Verification", "source": "certificate-verification.md" }
  ],
  "sessionId": "abc-123"
}
```

Omit `sessionId` on the first message; reuse the one returned for follow-ups so the
assistant remembers context.

### `GET /api/health`

```json
{ "status": "ok", "service": "authnode-chatbot", "ollama": true, "model": "llama3.1:8b" }
```

## Frontend integration

`frontend/src/components/ChatWidget.jsx` already calls this service via
`askChatbot()` in `frontend/src/lib/api.js`. It targets
`VITE_CHAT_URL` (defaults to `http://localhost:8000`) — set that env var on
the frontend if you deploy the chatbot service somewhere other than localhost.

## Testing

```bash
pytest test_chatbot.py -v
```

Covers retrieval accuracy per topic, hallucination resistance, out-of-domain relevance
scoring, and intent detection. The retrieval tests need a built vector store
(`python ingest.py` first); the pure intent-detection tests need nothing else.

### Tuning `RELEVANCE_THRESHOLD`

Run `test_capital_of_france_is_low_relevance` and `test_authnode_question_scores_higher_than_unrelated`
and look at the printed scores on your machine — the exact scale depends on your
embedding model. Adjust `RELEVANCE_THRESHOLD` in `.env` so genuinely off-topic
questions fall below it and real AuthNode questions clear it.

## Troubleshooting

- **"I don't have enough information..." on questions that should be answered** —
  either `RELEVANCE_THRESHOLD` is set too high, or the relevant doc doesn't exist in
  `data/` yet. Add it and re-run `python ingest.py`.
- **Chatbot always says Ollama isn't connected** — run `ollama serve` in a separate
  terminal, and confirm `ollama pull llama3.1:8b` (or your configured `MODEL_NAME`)
  completed.
- **CORS errors from the frontend** — check `FRONTEND_URL` in `.env` includes your
  frontend's actual origin.

## Security

- No API keys are used or hardcoded (Ollama and embeddings both run locally).
- Message length is capped (2000 chars) via Pydantic validation.
- Rate limited per IP (`RATE_LIMIT` in `.env`, default 20/minute).
- The system prompt explicitly instructs the model to ignore in-message attempts to
  override its instructions or reveal internal configuration.
- All unhandled errors return a generic message — no stack traces reach the client.

## Future improvements

- Swap the in-memory session store for Redis if this needs to run across multiple
  processes/instances.
- Add streaming responses for a more responsive UI.
- If blockchain/IPFS support is added to AuthNode itself, update the knowledge base
  and re-ingest.
