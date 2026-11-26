# How AuthNode verifies a certificate

AuthNode supports two frontend flows: certificate ID + PDF upload, and the existing email-image + certificate-image comparison flow.

## Verification steps

1. The user supplies the Certificate ID and may upload a PDF. The PDF must be no larger than 10 MB and pass the basic PDF header/type checks.
2. AuthNode looks up the official SQLite record and institution public key.
3. The backend rebuilds the canonical certificate string from the stored fields and recomputes its SHA-256 fingerprint.
4. The backend verifies the institution's RSA-PSS signature. Missing or invalid signatures do not pass.
5. If blockchain is enabled, the backend reads the smart contract and checks registration, hash match, issuer and revocation status. RPC failure is an inconclusive verification error, never a success.
6. The API returns the actual backend result. The RAG assistant can call the same read-only verification/status APIs when a Certificate ID is mentioned.

## Possible results

- **Verified** — Local canonical hash and RSA signature checks passed; if blockchain is enabled, the on-chain registration, hash and revocation checks also passed.
- **Not found** — The Certificate ID does not exist in AuthNode's local certificate records.
- **Not registered** — A local record exists, but the configured blockchain has no matching registration.
- **Tampered** — The canonical SHA-256 fingerprint does not match the stored/on-chain fingerprint.
- **Signature invalid** — The issuer public key/signature is missing or the RSA signature check failed.
- **Revoked** — The certificate has been revoked locally or on chain.
- **Verification error** — The backend, RPC provider or contract could not complete the required check. No genuine conclusion can be made.

## PDF fingerprint note

The uploaded PDF's raw-byte SHA-256 is returned as a separate audit value. It is not compared with the canonical certificate-data hash. Re-exporting, scanning, or changing PDF metadata changes raw bytes even if the certificate details are unchanged. AuthNode verifies the official canonical record using the Certificate ID; this upload endpoint does not prove that arbitrary PDF artwork is byte-for-byte identical to an issued file.
