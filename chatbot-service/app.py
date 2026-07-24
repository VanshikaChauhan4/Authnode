"""AuthNode RAG chatbot — LangChain retrieval with optional Ollama generation."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
from pydantic import BaseModel, Field

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = BASE_DIR / "chroma_db"
EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

app = FastAPI(title="AuthNode Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are the AuthNode Assistant, a helpful support agent for a certificate verification web app.
Use only the supplied context when answering product questions. Be concise, practical, and friendly.
If the answer is not in the context, say that AuthNode docs do not include it yet and suggest a safe next step.
Do not invent certificate records, private keys, users, or verification results.

Context:
{context}
"""

PROMPT = ChatPromptTemplate.from_messages([("system", SYSTEM_PROMPT), ("human", "{question}")])

_retriever = None
_llm = None
_ollama_available = None


def get_retriever():
    global _retriever
    if _retriever is not None:
        return _retriever
    if not CHROMA_DIR.exists():
        from ingest import ingest
        ingest()
    embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
    vectorstore = Chroma(persist_directory=str(CHROMA_DIR), embedding_function=embeddings)
    _retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    return _retriever


def get_llm():
    global _llm, _ollama_available
    if _llm is not None or _ollama_available is False:
        return _llm
    try:
        llm = ChatOllama(model=OLLAMA_MODEL, temperature=0.2)
        llm.invoke("Reply with pong.")
        _ollama_available = True
        _llm = llm
    except Exception:
        _ollama_available = False
        _llm = None
    return _llm


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class Source(BaseModel):
    source: str
    preview: str


class ChatResponse(BaseModel):
    answer: str
    mode: str
    sources: list[Source] = []


def build_sources(docs) -> list[Source]:
    sources = []
    seen = set()
    for doc in docs:
        name = Path(doc.metadata.get("source", "AuthNode docs")).name
        if name in seen:
            continue
        seen.add(name)
        preview = " ".join(doc.page_content.strip().split())[:180]
        sources.append(Source(source=name, preview=preview))
    return sources


def fallback_answer(docs) -> str:
    if not docs:
        return "I do not have that in the AuthNode docs yet. Try the Verify page for certificate checks or contact the issuing institution."
    bullets = []
    for doc in docs[:3]:
        text = " ".join(doc.page_content.strip().split())
        if text:
            bullets.append(f"• {text[:420]}")
    return "Here is what I found in the AuthNode knowledge base:\n\n" + "\n\n".join(bullets)


@app.on_event("startup")
def startup() -> None:
    get_retriever()
    get_llm()


@app.get("/health")
def health():
    return {"status": "ok", "service": "authnode-chatbot", "ollama": _ollama_available, "model": OLLAMA_MODEL}


@app.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest):
    question = body.question.strip()
    docs = get_retriever().invoke(question)
    sources = build_sources(docs)
    context = "\n\n---\n\n".join(d.page_content for d in docs)
    llm = get_llm()
    if llm is None:
        return ChatResponse(answer=fallback_answer(docs), mode="retrieval-only", sources=sources)
    response = (PROMPT | llm).invoke({"context": context, "question": question})
    answer = response.content if hasattr(response, "content") else str(response)
    return ChatResponse(answer=answer.strip(), mode="rag", sources=sources)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
