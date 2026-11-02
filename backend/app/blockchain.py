
"""Secure adapter to the project's ethers.js blockchain bridge.

Blockchain integration remains opt-in until explicitly configured.
"""
from __future__ import annotations

import json
import logging
import os
import re
import shutil
import subprocess

from pathlib import Path
from dotenv import load_dotenv


# --------------------------------------------------
# PROJECT CONFIGURATION
# --------------------------------------------------

ROOT = Path(__file__).resolve().parents[2]

BLOCKCHAIN_DIR = ROOT / "blockchain"
BRIDGE = BLOCKCHAIN_DIR / "scripts" / "bridge.js"
ENV_FILE = BLOCKCHAIN_DIR / ".env"

logger = logging.getLogger("authnode.blockchain")

# Load blockchain environment variables
load_dotenv(ENV_FILE, override=False)


# --------------------------------------------------
# CUSTOM EXCEPTION
# --------------------------------------------------

class BlockchainUnavailable(RuntimeError):
    """Raised when blockchain integration cannot be used."""
    pass


# --------------------------------------------------
# CONFIGURATION CHECKS
# --------------------------------------------------

def is_enabled() -> bool:
    """Check whether blockchain integration is enabled."""
    return os.getenv("BLOCKCHAIN_ENABLED", "false").strip().lower() in {
        "true", "1", "yes", "on"
    }


def _validate_input(value: str, field: str) -> str:
    """Validate input before passing it to the Node.js bridge."""

    if not isinstance(value, str):
        raise ValueError(f"{field} must be a string.")

    value = value.strip()

    if not value:
        raise ValueError(f"{field} cannot be empty.")

    if len(value) > 256:
        raise ValueError(f"{field} is too long.")

    if "\x00" in value:
        raise ValueError(f"{field} contains invalid characters.")

    return value


def _validate_hash(sha256_hex: str) -> str:
    """Validate SHA-256 hash format."""

    sha256_hex = _validate_input(sha256_hex, "SHA-256 hash")

    if not re.fullmatch(r"[a-fA-F0-9]{64}", sha256_hex):
        raise ValueError(
            "Invalid SHA-256 hash. Expected exactly 64 hexadecimal characters."
        )

    return sha256_hex.lower()


# --------------------------------------------------
# NODE.JS BRIDGE
# --------------------------------------------------

def _run(command: str, *args: str) -> dict:
    """Execute the ethers.js bridge securely."""

    if not is_enabled():
        raise BlockchainUnavailable(
            "Blockchain integration is disabled. "
            "Configure blockchain/.env and set BLOCKCHAIN_ENABLED=true."
        )

    if not BRIDGE.is_file():
        raise BlockchainUnavailable(
            f"Blockchain bridge not found: {BRIDGE}"
        )

    # Find Node.js installation
    node = shutil.which("node")

    if not node:
        raise BlockchainUnavailable(
            "Node.js is not installed or is missing from PATH."
        )

    allowed_commands = {"issue", "verify", "get", "revoke"}

    if command not in allowed_commands:
        raise ValueError("Invalid blockchain command.")

    validated_args = [
        _validate_input(arg, "Argument") for arg in args
    ]

    try:
        completed = subprocess.run(
            [node, str(BRIDGE), command, *validated_args],
            cwd=str(BLOCKCHAIN_DIR),
            capture_output=True,
            text=True,
            timeout=45,
            check=False,
            shell=False,
        )

    except subprocess.TimeoutExpired as exc:
        logger.error("Blockchain bridge timed out.")
        raise BlockchainUnavailable(
            "Blockchain request timed out."
        ) from exc

    except OSError as exc:
        logger.exception("Unable to execute blockchain bridge.")
        raise BlockchainUnavailable(
            "Unable to start the blockchain bridge."
        ) from exc

    if completed.returncode != 0:
        logger.error(
            "Blockchain bridge failed (exit code %s): %s",
            completed.returncode,
            completed.stderr.strip()[:2000],
        )

        raise BlockchainUnavailable(
            "Blockchain provider request failed. Check server logs."
        )

    try:
        result = json.loads(completed.stdout)

    except (json.JSONDecodeError, TypeError):
        logger.error(
            "Invalid JSON response from blockchain bridge: %s",
            completed.stdout[:1000],
        )

        raise BlockchainUnavailable(
            "Blockchain bridge returned an invalid response."
        )

    if not isinstance(result, dict):
        raise BlockchainUnavailable(
            "Blockchain bridge returned an unexpected response."
        )

    if result.get("error"):
        logger.error(
            "Blockchain operation returned an error: %s",
            str(result["error"])[:1000],
        )
        raise BlockchainUnavailable(
            "Blockchain operation failed."
        )

    return result


# --------------------------------------------------
# PUBLIC BLOCKCHAIN OPERATIONS
# --------------------------------------------------

def issue(certificate_id: str, sha256_hex: str) -> dict:
    """Issue a certificate hash on the blockchain."""

    certificate_id = _validate_input(
        certificate_id, "Certificate ID"
    )

    sha256_hex = _validate_hash(sha256_hex)

    return _run("issue", certificate_id, sha256_hex)


def verify(certificate_id: str, sha256_hex: str) -> dict:
    """Verify a certificate against its blockchain hash."""

    certificate_id = _validate_input(
        certificate_id, "Certificate ID"
    )

    sha256_hex = _validate_hash(sha256_hex)

    return _run("verify", certificate_id, sha256_hex)


def get(certificate_id: str) -> dict:
    """Retrieve certificate information from blockchain."""

    certificate_id = _validate_input(
        certificate_id, "Certificate ID"
    )

    return _run("get", certificate_id)


def revoke(certificate_id: str) -> dict:
    """Revoke a certificate on the blockchain."""

    certificate_id = _validate_input(
        certificate_id, "Certificate ID"
    )

    return _run("revoke", certificate_id)
