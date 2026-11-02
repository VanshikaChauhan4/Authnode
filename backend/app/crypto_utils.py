"""Cryptographic utilities for AuthNode certificate verification."""

import hashlib
import json

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding


def canonicalize_certificate(data: dict) -> bytes:
    """
    Convert certificate data into a consistent byte representation.

    The same certificate details will always produce the same output,
    regardless of the order of keys in the input dictionary.
    """
    if not isinstance(data, dict):
        raise TypeError("Certificate data must be a dictionary.")

    fields = {
        "student_name": "lower",
        "certificate_id": "upper",
        "certificate_title": "lower",
        "course_name": "lower",
        "institution_name": "lower",
        "student_email": "lower",
        "issue_date": "keep",
        "issuer_name": "lower",
    }

    canonical_data = {}

    for field, normalization in fields.items():
        value = str(data.get(field, "")).strip()

        if normalization == "lower":
            value = value.lower()
        elif normalization == "upper":
            value = value.upper()

        canonical_data[field] = value

    return json.dumps(
        canonical_data,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def compute_sha256_hash(data: dict) -> str:
    """Generate a SHA-256 hash of canonical certificate data."""
    encoded = canonicalize_certificate(data)
    return hashlib.sha256(encoded).hexdigest()


def verify_rsa_signature(
    data: dict,
    signature_hex: str,
    public_key,
) -> bool:
    """
    Verify an RSA signature using PKCS#1 v1.5 and SHA-256.

    Returns True if the signature is valid, otherwise False.
    """
    try:
        if not isinstance(signature_hex, str) or not signature_hex.strip():
            return False

        if public_key is None:
            return False

        encoded = canonicalize_certificate(data)
        signature = bytes.fromhex(signature_hex.strip())

        public_key.verify(
            signature,
            encoded,
            padding.PKCS1v15(),
            hashes.SHA256(),
        )

        return True

    except (InvalidSignature, ValueError, TypeError, AttributeError):
        return False