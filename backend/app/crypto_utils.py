"""Cryptographic helpers used by the AuthNode FastAPI backend.

Certificates are fingerprinted using SHA-256 and signed by an institution's
RSA private key. PEM keys are stored as text; signatures are returned as hex.
"""

from __future__ import annotations

import hashlib
import secrets
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


def fingerprint(value: str | bytes) -> str:
    """Return the lowercase SHA-256 hex digest of text or bytes."""
    if isinstance(value, str):
        value = value.encode("utf-8")
    if not isinstance(value, bytes):
        raise TypeError("Fingerprint input must be str or bytes.")
    return hashlib.sha256(value).hexdigest()


def cert_id_from_hash(digest: str, length: int = 12) -> str:
    """Create a compact, deterministic certificate ID from a SHA-256 digest."""
    if not isinstance(digest, str) or len(digest) != 64:
        raise ValueError("Expected a 64-character SHA-256 hex digest.")
    try:
        bytes.fromhex(digest)
    except ValueError as exc:
        raise ValueError("Digest must contain hexadecimal characters only.") from exc
    if not 8 <= length <= 64:
        raise ValueError("Certificate ID length must be between 8 and 64.")
    return digest.lower()[:length]


def new_token() -> str:
    """Create a cryptographically random session token."""
    return secrets.token_urlsafe(48)


def generate_keypair() -> tuple[str, str]:
    """Generate a 2048-bit RSA keypair and return (private_pem, public_pem)."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("ascii")
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("ascii")
    return private_pem, public_pem


def _digest_bytes(digest: str) -> bytes:
    if not isinstance(digest, str) or len(digest) != 64:
        raise ValueError("Expected a 64-character SHA-256 hex digest.")
    try:
        return bytes.fromhex(digest)
    except ValueError as exc:
        raise ValueError("Digest must contain hexadecimal characters only.") from exc


def sign_hash(digest: str, private_key_pem: str) -> str:
    """Sign a SHA-256 digest with an RSA private key; return hex signature."""
    if not isinstance(private_key_pem, str) or not private_key_pem.strip():
        raise ValueError("A PEM private key is required.")
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode("utf-8"),
        password=None,
    )
    if not isinstance(private_key, rsa.RSAPrivateKey):
        raise TypeError("The signing key must be an RSA private key.")
    signature = private_key.sign(
        _digest_bytes(digest),
        padding.PKCS1v15(),
        hashes.SHA256(),
    )
    return signature.hex()


def verify_signature(digest: str, signature_hex: str, public_key_pem: str) -> bool:
    """Verify an RSA/SHA-256 signature. Invalid data returns False."""
    try:
        if not isinstance(signature_hex, str) or not signature_hex.strip():
            return False
        if not isinstance(public_key_pem, str) or not public_key_pem.strip():
            return False
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode("utf-8")
        )
        if not isinstance(public_key, rsa.RSAPublicKey):
            return False
        signature = bytes.fromhex(signature_hex.strip())
        public_key.verify(
            signature,
            _digest_bytes(digest),
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
        return True
    except (InvalidSignature, ValueError, TypeError, AttributeError):
        return False


# Compatibility helpers for callers that need canonical JSON data. The
# production issue/verify flow above deliberately uses the same pipe-delimited
# representation in both places in app/main.py.
def canonicalize_certificate(data: dict[str, Any]) -> bytes:
    import json

    if not isinstance(data, dict):
        raise TypeError("Certificate data must be a dictionary.")
    normalized = {
        "student_name": str(data.get("student_name", "")).strip().lower(),
        "certificate_id": str(data.get("certificate_id", "")).strip().upper(),
        "certificate_title": str(data.get("certificate_title", "")).strip().lower(),
        "course_name": str(data.get("course_name", "")).strip().lower(),
        "institution_name": str(data.get("institution_name", "")).strip().lower(),
        "student_email": str(data.get("student_email", "")).strip().lower(),
        "issue_date": str(data.get("issue_date", "")).strip(),
        "issuer_name": str(data.get("issuer_name", "")).strip().lower(),
    }
    return json.dumps(
        normalized,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def compute_sha256_hash(data: dict[str, Any]) -> str:
    """Hash canonical JSON certificate data (compatibility helper)."""
    return fingerprint(canonicalize_certificate(data))


def verify_rsa_signature(data: dict[str, Any], signature_hex: str, public_key) -> bool:
    """Verify a signature over canonical JSON certificate data."""
    try:
        encoded = canonicalize_certificate(data)
        signature = bytes.fromhex(signature_hex)
        public_key.verify(
            signature,
            encoded,
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
        return True
    except (InvalidSignature, ValueError, TypeError, AttributeError):
        return False
