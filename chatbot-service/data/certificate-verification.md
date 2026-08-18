# How AuthNode verifies a certificate

Anyone can verify a certificate on the Verify page — no account or sign-in required.

## What you need

Either:
- The **Certificate ID** (a short code, shared as text or inside a QR code), or
- A scan of the **QR code** itself, which contains the Certificate ID.

## What happens during verification

1. You submit the Certificate ID (by pasting it or scanning the QR code).
2. AuthNode looks up the certificate record with that ID.
3. AuthNode recomputes the fingerprint from the stored student name, course,
   institution, and issue date, and compares it to the fingerprint saved at issuance.
4. AuthNode checks the issuing institution's digital signature on that fingerprint,
   using the institution's public key.
5. AuthNode returns one of three results.

## The three possible results

- **Verified** — A matching record exists, the recomputed fingerprint matches the
  stored one, and the institution's signature checks out. The certificate has not been
  altered since it was issued.
- **Not found** — No certificate in the system matches that ID. This usually means a
  typo in the ID, or the certificate was never issued through AuthNode.
- **Does not match / tampered** — A record exists, but either the fingerprint no longer
  matches (the underlying details were changed) or the signature doesn't check out.
  Treat a certificate in this state as unverified.

## Why this can't be faked

The fingerprint depends on the exact certificate details, and the signature depends on
the institution's private key, which only the institution holds. Someone editing a
certificate's details after issuance — even changing one letter of the course name —
would produce a fingerprint that no longer matches the signed one. There's no way to
edit the visible details without breaking the underlying proof.
