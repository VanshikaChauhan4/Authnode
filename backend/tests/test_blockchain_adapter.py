import pytest
from app import blockchain


def test_blockchain_is_disabled_by_default(monkeypatch):
    monkeypatch.delenv("BLOCKCHAIN_ENABLED", raising=False)
    assert blockchain.is_enabled() is False


def test_disabled_chain_fails_closed(monkeypatch):
    monkeypatch.setenv("BLOCKCHAIN_ENABLED", "false")
    with pytest.raises(blockchain.BlockchainUnavailable):
        blockchain.verify("CERT101", "a" * 64)
