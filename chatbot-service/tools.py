"""Backend-connected tools for the AuthNode support agent.

These tools are read-only: the AI cannot issue or revoke certificates.
"""
from __future__ import annotations
import os
import httpx
from langchain_core.tools import tool

API_BASE = os.getenv("AUTHNODE_API_URL", "http://localhost:5000/api").rstrip("/")

@tool
def verify_certificate(certificate_id: str) -> dict:
    """Fetch the live cryptographic verification result for a certificate ID from AuthNode."""
    try:
        response = httpx.get(f"{API_BASE}/certificates/verify/{certificate_id.strip()}", timeout=12)
        response.raise_for_status()
        data = response.json()
        entry = data.get("entry") or {}
        return {
            "certificate_id": certificate_id,
            "verification_status": data.get("status", "unknown"),
            "certificate_hash": entry.get("hash"),
            "issuer": entry.get("institution"),
            "blockchain_transaction": entry.get("blockchain_tx_hash"),
            "blockchain_network": entry.get("blockchain_network"),
            "source": "live_authnode_backend",
        }
    except httpx.HTTPError as exc:
        return {"certificate_id": certificate_id, "verification_status": "verification_error", "error": str(exc), "source": "live_authnode_backend"}

@tool
def get_certificate_status(certificate_id: str) -> dict:
    """Fetch current local and blockchain registration/revocation status for a certificate ID."""
    try:
        response = httpx.get(f"{API_BASE}/certificates/{certificate_id.strip()}/status", timeout=12)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        return {"certificate_id": certificate_id, "status": "VERIFICATION_ERROR", "error": str(exc)}

@tool
def explain_blockchain_verification() -> str:
    """Explain how AuthNode anchors certificate fingerprints on Ethereum."""
    return "AuthNode hashes canonical certificate data with SHA-256, signs the hash with the institution RSA key, and (when Sepolia is configured) registers the hash, certificate ID, issuer address and timestamps in an Ethereum smart contract. The chain does not contain the PDF or student personal data."

@tool
def explain_sha256() -> str:
    """Explain SHA-256 certificate fingerprinting."""
    return "SHA-256 deterministically maps the canonical certificate data to a 256-bit fingerprint. A change to the canonical fields produces a different fingerprint. It is an integrity fingerprint, not encryption."

@tool
def explain_digital_signature() -> str:
    """Explain the RSA digital signature used by AuthNode."""
    return "AuthNode signs the certificate SHA-256 fingerprint with the institution's RSA private key and checks the signature using its registered public key. The private key must remain secret; the public key is used for verification."

@tool
def explain_certificate_security() -> str:
    """Explain the certificate security checks performed by AuthNode."""
    return "AuthNode combines canonical-data SHA-256 hashing, institution RSA signature verification, and (when configured) Ethereum registration and revocation checks. The live backend result—not an AI prediction—determines a certificate's verification status."

READ_ONLY_TOOLS = [verify_certificate, get_certificate_status, explain_blockchain_verification, explain_sha256, explain_digital_signature, explain_certificate_security]
