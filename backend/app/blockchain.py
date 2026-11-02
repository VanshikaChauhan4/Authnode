"""Secure adapter to the project's ethers.js bridge. Blockchain is opt-in until configured."""
from __future__ import annotations
import json
import os
import logging
import subprocess
from dotenv import load_dotenv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BRIDGE = ROOT / "blockchain" / "scripts" / "bridge.js"
load_dotenv(ROOT / "blockchain" / ".env")

class BlockchainUnavailable(RuntimeError):
    pass

def is_enabled() -> bool:
    return os.getenv("BLOCKCHAIN_ENABLED", "false").lower() == "true"

def _run(command: str, *args: str) -> dict:
    if not is_enabled():
        raise BlockchainUnavailable("Blockchain integration is not enabled. Configure blockchain/.env and set BLOCKCHAIN_ENABLED=true.")
    if not BRIDGE.exists():
        raise BlockchainUnavailable("Blockchain bridge is missing.")
    try:
        completed = subprocess.run(
            ["node", str(BRIDGE), command, *[str(a) for a in args]],
            cwd=str(ROOT / "blockchain"), capture_output=True, text=True, timeout=45, check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise BlockchainUnavailable(f"Blockchain bridge could not run: {exc}") from exc
    if completed.returncode != 0:
        logging.getLogger("authnode.blockchain").error("ethers bridge failed: %s", completed.stderr.strip())
        raise BlockchainUnavailable("Blockchain provider request failed. Check server logs.")
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise BlockchainUnavailable("Blockchain bridge returned an invalid response.") from exc

def issue(certificate_id: str, sha256_hex: str) -> dict:
    return _run("issue", certificate_id, sha256_hex)

def verify(certificate_id: str, sha256_hex: str) -> dict:
    return _run("verify", certificate_id, sha256_hex)

def get(certificate_id: str) -> dict:
    return _run("get", certificate_id)

def revoke(certificate_id: str) -> dict:
    return _run("revoke", certificate_id)
