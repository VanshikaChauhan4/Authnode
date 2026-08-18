"""Build the Chroma vector store from AuthNode knowledge-base markdown files."""

from __future__ import annotations

import shutil
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_huggingface import HuggingFaceEmbeddings

from config import DATA_DIR, EMBEDDING_MODEL, VECTOR_DB_PATH as CHROMA_DIR

# Per-file metadata used for citations and future filtering/debugging.
# "title" is the human-readable name shown in source citations; the rest
# match the intent categories used elsewhere in the service.
DOC_METADATA: dict[str, dict[str, str]] = {
    "authnode-overview.md": {
        "title": "AuthNode Overview",
        "category": "authnode_overview",
        "audience": "all",
    },
    "certificate-generation.md": {
        "title": "Certificate Generation",
        "category": "certificate_generation",
        "audience": "institute",
    },
    "certificate-verification.md": {
        "title": "Certificate Verification",
        "category": "certificate_verification",
        "audience": "all",
    },
    "student-guide.md": {
        "title": "Student Guide",
        "category": "student_help",
        "audience": "student",
    },
    "institute-guide.md": {
        "title": "Institute Guide",
        "category": "institute_help",
        "audience": "institute",
    },
    "verifier-guide.md": {
        "title": "Verifier Guide",
        "category": "verifier_help",
        "audience": "company",
    },
    "security-and-trust.md": {
        "title": "Security and Trust",
        "category": "security",
        "audience": "all",
    },
    "authnode-benefits.md": {
        "title": "Why AuthNode",
        "category": "authnode_overview",
        "audience": "all",
    },
    "faq.md": {
        "title": "FAQ",
        "category": "faq",
        "audience": "all",
    },
    "troubleshooting.md": {
        "title": "Troubleshooting",
        "category": "troubleshooting",
        "audience": "all",
    },
    "chatbot-scope.md": {
        "title": "About This Assistant",
        "category": "chatbot_scope",
        "audience": "all",
    },
    "roadmap.md": {
        "title": "Roadmap",
        "category": "faq",
        "audience": "all",
    },
}


def ingest() -> None:
    if not DATA_DIR.exists():
        raise FileNotFoundError(f"Missing data directory: {DATA_DIR}")

    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)

    loader = DirectoryLoader(
        str(DATA_DIR),
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
    )
    documents = loader.load()
    if not documents:
        raise RuntimeError("No markdown documents found in data/")

    for doc in documents:
        filename = Path(doc.metadata.get("source", "")).name
        meta = DOC_METADATA.get(filename, {"title": filename, "category": "faq", "audience": "all"})
        doc.metadata.update({"source": filename, **meta})

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
    )
    print(f"Ingested {len(chunks)} chunks from {len(documents)} documents into {CHROMA_DIR}")


if __name__ == "__main__":
    ingest()
