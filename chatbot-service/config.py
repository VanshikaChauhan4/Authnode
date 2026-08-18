"""Central configuration, loaded from environment variables. Nothing is hardcoded."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

VECTOR_DB_PATH = Path(os.getenv("VECTOR_DB_PATH", str(BASE_DIR / "chroma_db")))
DATA_DIR = BASE_DIR / "data"

MODEL_NAME = os.getenv("MODEL_NAME", "llama3.1:8b")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

PORT = int(os.getenv("PORT", "8000"))

# Comma-separated list of allowed frontend origins.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
FRONTEND_URL = os.getenv("FRONTEND_URL", _default_origins)
ALLOWED_ORIGINS = [o.strip() for o in FRONTEND_URL.split(",") if o.strip()]

RETRIEVAL_K = int(os.getenv("RETRIEVAL_K", "4"))

# Relevance scores from Chroma's similarity_search_with_relevance_scores are
# roughly 0-1 (higher = more relevant), though the exact scale depends on the
# embedding model. This threshold decides "is this question actually about
# AuthNode at all?" before we bother calling the LLM. Tune it by running
# test_retrieval.py locally and looking at real scores for in-domain vs
# out-of-domain questions on your machine.
RELEVANCE_THRESHOLD = float(os.getenv("RELEVANCE_THRESHOLD", "0.15"))

# How many past turns (user+assistant pairs) to keep per session, to bound
# both memory usage and prompt size.
MAX_HISTORY_TURNS = int(os.getenv("MAX_HISTORY_TURNS", "6"))

RATE_LIMIT = os.getenv("RATE_LIMIT", "20/minute")
