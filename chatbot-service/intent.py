"""Lightweight, dependency-free intent detection.

This is deliberately simple keyword matching, not a trained classifier —
it's used to softly bias retrieval toward the right document category, not
as the primary safety mechanism (that's the relevance-score gate in app.py).
A wrong guess here just means retrieval falls back to unfiltered search.
"""

from __future__ import annotations

INTENT_KEYWORDS: dict[str, list[str]] = {
    "certificate_generation": ["issue", "generate", "create certificate", "how do i get my certificate"],
    "certificate_verification": ["verify", "verification", "check certificate", "authentic", "valid"],
    "student_help": ["student", "dashboard", "my certificate", "download"],
    "institute_help": ["institute", "institution", "issuing institution", "registrar"],
    "verifier_help": ["employer", "recruiter", "company", "verifier", "hiring"],
    "security": ["fingerprint", "hash", "signature", "sha-256", "sha256", "rsa", "tamper", "fraud", "secure", "security"],
    "blockchain_explanation": ["blockchain"],
    "ipfs_explanation": ["ipfs"],
    "authnode_overview": ["what is authnode", "why authnode", "about authnode"],
    "troubleshooting": ["not found", "doesn't work", "error", "problem", "issue with", "can't find", "failed"],
    "chatbot_scope": ["who are you", "what can you do", "what is langchain", "what is rag"],
}

# Maps an intent to the document metadata "category" used in ingest.py
INTENT_TO_CATEGORY: dict[str, str] = {
    "certificate_generation": "certificate_generation",
    "certificate_verification": "certificate_verification",
    "student_help": "student_help",
    "institute_help": "institute_help",
    "verifier_help": "verifier_help",
    "security": "security",
    "authnode_overview": "authnode_overview",
    "troubleshooting": "troubleshooting",
    "chatbot_scope": "chatbot_scope",
}


def detect_intent(question: str) -> str:
    q = question.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in q for kw in keywords):
            return intent
    return "general"
