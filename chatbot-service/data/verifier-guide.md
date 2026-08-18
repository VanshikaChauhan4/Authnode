# Verifier / employer guide

## You don't need an account

Certificate verification is open to anyone. You do not need to sign in or create an
AuthNode account to verify a certificate.

## What you need from the candidate

Either:
- Their **Certificate ID** (a short code), or
- A **QR code** they share with you (from their certificate or Dashboard).

## How to verify

1. Go to the **Verify** page.
2. Paste the Certificate ID, or scan the QR code.
3. Read the result.

## Reading the result

- **Verified** — The certificate matches AuthNode's stored record, and the issuing
  institution's digital signature checks out. You can trust the details shown
  (student name, course, institution, issue date) reflect exactly what was issued.
- **Not found** — No certificate matches that ID. Double check the ID for typos, or
  ask the candidate to re-share their QR code.
- **Does not match / tampered** — A record exists but the certificate's details no
  longer match what was signed at issuance. Treat this certificate as unverified —
  something about it doesn't line up with the original record.

## Why you should trust a "Verified" result

The result depends on two independent checks: the fingerprint (derived purely from the
certificate's own details) and the institution's digital signature (which only the
issuing institution could have produced, since only they hold the private key). An
attacker would need to forge a valid signature from the institution's private key to
produce a false "Verified" result, which isn't something that can be done by editing
the certificate's visible details.

AuthNode does not claim to be completely fraud-proof — no verification system can
promise that. What it's designed to do is make unauthorized changes to a certificate
detectable, rather than requiring you to just take the certificate at face value.
