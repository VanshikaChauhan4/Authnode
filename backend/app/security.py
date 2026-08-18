"""Password hashing — PBKDF2-HMAC-SHA256, stdlib only (no native deps to install)."""

from __future__ import annotations

import hashlib
import hmac
import secrets

_ITERATIONS = 260_000


def hash_password(password: str) -> tuple[str, str]:
    """Returns (password_hash_hex, salt_hex)."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), _ITERATIONS
    )
    return digest.hex(), salt


def verify_password(password: str, password_hash_hex: str, salt_hex: str) -> bool:
    if not password_hash_hex or not salt_hex:
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), _ITERATIONS
    )
    return hmac.compare_digest(digest.hex(), password_hash_hex)
