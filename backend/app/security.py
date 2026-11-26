"""Password hashing — PBKDF2-HMAC-SHA256, stdlib only (no native deps to install)."""

from __future__ import annotations

import hashlib
import hmac
import secrets
import os
from pathlib import Path
from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

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


_KEY_FILE = Path(__file__).resolve().parent.parent / ".private_key_fernet.key"

def _fernet() -> Fernet:
    """Use an externally supplied Fernet key in production; local dev gets a gitignored key file."""
    configured = os.getenv("AUTHNODE_KEY_ENCRYPTION_KEY")
    if configured and configured != "YOUR_FERNET_KEY":
        key = configured.encode("ascii")
    else:
        if os.getenv("AUTHNODE_ENV", "development") == "production":
            raise RuntimeError("AUTHNODE_KEY_ENCRYPTION_KEY must be configured in production")
        if not _KEY_FILE.exists():
            _KEY_FILE.parent.mkdir(parents=True, exist_ok=True)
            _KEY_FILE.write_bytes(Fernet.generate_key())
            try:
                _KEY_FILE.chmod(0o600)
            except OSError:
                pass
        key = _KEY_FILE.read_bytes().strip()
    return Fernet(key)

def encrypt_private_key(private_key_pem: str) -> str:
    return "enc:" + _fernet().encrypt(private_key_pem.encode("utf-8")).decode("ascii")

def decrypt_private_key(stored_value: str | None) -> str | None:
    if not stored_value:
        return stored_value
    # Backward compatibility for legacy rows created before key-at-rest encryption.
    if not stored_value.startswith("enc:"):
        return stored_value
    try:
        return _fernet().decrypt(stored_value[4:].encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError) as exc:
        raise RuntimeError("Institution private key could not be decrypted; check AUTHNODE_KEY_ENCRYPTION_KEY") from exc
