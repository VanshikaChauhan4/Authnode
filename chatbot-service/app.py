"""AuthNode RAG chatbot — Ollama + Chroma + HuggingFace embeddings."""

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
EMBED_MODEL = "all-MiniLM-L6-v2"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

app = FastAPI(title="AuthNode Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are the AuthNode Assistant — a friendly helper for a certificate verification app.
Answer in plain language. Never use jargon like SHA-256, blockchain, DID, or soulbound tokens unless the user asks.
Use short paragraphs. If the knowledge base does not contain the answer, say so and suggest checking Verify or contacting the issuing institution.

Context from AuthNode docs:
{context}
"""

PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", "{question}"),
    ]
)

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
    vectorstore = Chroma(
        persist_directory=str(CHROMA_DIR),
        embedding_function=embeddings,
    )
    _retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    return _retriever


def get_llm():
    global _llm, _ollama_available
    if _llm is not None:
        return _llm

    try:
        llm = ChatOllama(model=OLLAMA_MODEL, temperature=0.2)
        llm.invoke("ping")
        _ollama_available = True
        _llm = llm
    except Exception:
        _ollama_available = False
        _llm = None
    return _llm


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    answer: str
    mode: str


def fallback_answer(question: str, docs) -> str:
    if not docs:
        return (
            "I don't have specific info on that yet. Try the Verify page to check a certificate, "
            "or ask about issuing, verifying, or why a certificate might not verify."
        )

    snippets = []
    for doc in docs[:3]:
        text = doc.page_content.strip()
        if text:
            snippets.append(text)

    joined = "\n\n".join(snippets)
    return (
        f"Here's what I found in the AuthNode docs:\n\n{joined}\n\n"
        f"(Running without Ollama — start `ollama serve` and pull `{OLLAMA_MODEL}` for richer answers.)"
    )


@app.on_event("startup")
def startup() -> None:
    get_retriever()
    get_llm()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "authnode-chatbot",
        "ollama": _ollama_available,
        "model": OLLAMA_MODEL,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest):
    question = body.question.strip()
    retriever = get_retriever()
    docs = retriever.invoke(question)
    context = "\n\n---\n\n".join(d.page_content for d in docs)

    llm = get_llm()
    if llm is None:
        return ChatResponse(
            answer=fallback_answer(question, docs),
            mode="retrieval-only",
        )

    chain = PROMPT | llm
    response = chain.invoke({"context": context, "question": question})
    answer = response.content if hasattr(response, "content") else str(response)

    return ChatResponse(answer=answer.strip(), mode="rag")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
