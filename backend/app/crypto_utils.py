"""Certificate fingerprinting and RSA signing."""

from __future__ import annotations

import base64
import hashlib
import secrets

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


def build_cert_string(
    *,
    student_name: str,
    course: str,
    institution: str,
    issue_date: str,
) -> str:
    """Canonical string — field order must stay fixed for verification."""
    return (
        f"{student_name.strip().lower()}|"
        f"{course.strip().lower()}|"
        f"{institution.strip().lower()}|"
        f"{issue_date}"
    )


def fingerprint(cert_string: str) -> str:
    return hashlib.sha256(cert_string.encode("utf-8")).hexdigest()


def cert_id_from_hash(cert_hash: str) -> str:
    return cert_hash[:12]


def generate_keypair() -> tuple[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")
    return private_pem, public_pem


def sign_hash(cert_hash: str, private_key_pem: str) -> str:
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode("utf-8"),
        password=None,
    )
    signature = private_key.sign(
        cert_hash.encode("utf-8"),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )
    return base64.b64encode(signature).decode("ascii")


def verify_signature(cert_hash: str, signature_b64: str, public_key_pem: str) -> bool:
    try:
        public_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
        signature = base64.b64decode(signature_b64.encode("ascii"))
        public_key.verify(
            signature,
            cert_hash.encode("utf-8"),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False


def new_token() -> str:
    return secrets.token_urlsafe(32)
