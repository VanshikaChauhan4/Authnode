from app import crypto_utils, security


def test_sha256_is_deterministic_and_256_bit():
    value = "Ada Lovelace|ada@example.com|Computing|Certificate|issuer-1|Institute|2026-11-01"
    first = crypto_utils.fingerprint(value)
    assert first == crypto_utils.fingerprint(value)
    assert len(first) == 64


def test_rsa_signature_round_trip():
    private_key, public_key = crypto_utils.generate_keypair()
    digest = crypto_utils.fingerprint("authnode canonical certificate")
    signature = crypto_utils.sign_hash(digest, private_key)
    assert crypto_utils.verify_signature(digest, signature, public_key)
    assert not crypto_utils.verify_signature("different-hash", signature, public_key)


def test_private_key_encryption_round_trip():
    private_key, _ = crypto_utils.generate_keypair()
    encrypted = security.encrypt_private_key(private_key)
    assert encrypted.startswith("enc:")
    assert encrypted != private_key
    assert security.decrypt_private_key(encrypted) == private_key
