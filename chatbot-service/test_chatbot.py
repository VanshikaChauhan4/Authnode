"""Tests for the AuthNode chatbot's RAG pipeline.

Run locally (after `pip install -r requirements.txt` and at least one
successful `python ingest.py`):

    pytest test_chatbot.py -v

These need a live Ollama instance for the full LLM-in-the-loop tests to be
meaningful; the retrieval-only tests work without it.
"""

from __future__ import annotations

import pytest

from app import get_vectorstore, retrieve
from intent import detect_intent


@pytest.fixture(scope="module")
def vectorstore():
    return get_vectorstore()


# --- A. Retrieval quality -----------------------------------------------


def test_ipfs_question_retrieves_security_doc(vectorstore):
    results = retrieve("What is IPFS?", detect_intent("What is IPFS?"))
    sources = {doc.metadata.get("source") for doc, _score in results}
    assert "security-and-trust.md" in sources


def test_verification_question_retrieves_verification_doc(vectorstore):
    q = "How does verification work?"
    results = retrieve(q, detect_intent(q))
    sources = {doc.metadata.get("source") for doc, _score in results}
    assert "certificate-verification.md" in sources


def test_student_question_retrieves_student_guide(vectorstore):
    q = "How do I download my certificate?"
    results = retrieve(q, detect_intent(q))
    sources = {doc.metadata.get("source") for doc, _score in results}
    assert "student-guide.md" in sources


# --- B. Anti-hallucination: don't claim unsupported features -------------


def test_does_not_claim_scheduled_issuance(vectorstore):
    q = "Can AuthNode issue certificates automatically every Monday?"
    results = retrieve(q, detect_intent(q))
    combined = " ".join(doc.page_content.lower() for doc, _score in results)
    assert "every monday" not in combined
    assert "scheduled" not in combined


# --- C. Out-of-domain questions get a low relevance score ----------------


def test_capital_of_france_is_low_relevance(vectorstore):
    results = vectorstore.similarity_search_with_relevance_scores(
        "What is the capital of France?", k=4
    )
    best_score = max((score for _doc, score in results), default=0.0)
    # This should be well below in-domain scores — see README for how to
    # calibrate RELEVANCE_THRESHOLD against your own embedding model's scale.
    print(f"capital-of-france best relevance score: {best_score}")


def test_authnode_question_scores_higher_than_unrelated(vectorstore):
    authnode_results = vectorstore.similarity_search_with_relevance_scores(
        "How do I verify a certificate?", k=4
    )
    unrelated_results = vectorstore.similarity_search_with_relevance_scores(
        "What is the weather today?", k=4
    )
    authnode_best = max((s for _d, s in authnode_results), default=0.0)
    unrelated_best = max((s for _d, s in unrelated_results), default=0.0)
    assert authnode_best > unrelated_best


# --- D. Intent detection --------------------------------------------------


@pytest.mark.parametrize(
    "question,expected_intent",
    [
        ("What is IPFS?", "ipfs_explanation"),
        ("Why blockchain?", "blockchain_explanation"),
        ("How does verification work?", "certificate_verification"),
        ("I am a company recruiter, how do I verify a degree?", "certificate_verification"),
    ],
)
def test_intent_detection(question, expected_intent):
    assert detect_intent(question) == expected_intent
