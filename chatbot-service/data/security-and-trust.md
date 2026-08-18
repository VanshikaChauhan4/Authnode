# Security and trust — how AuthNode actually works today

## The two mechanisms doing the work

**1. Cryptographic fingerprinting (SHA-256).**
Every certificate's student name, course, institution, and issue date are combined
into one string and hashed with SHA-256. Think of it like a tamper-evident seal:
change even a single character in the underlying details, and the resulting
fingerprint is completely different, with no way to predict how. This makes silent
edits mathematically obvious rather than a matter of trust.

**2. Digital signatures (RSA).**
When an institution's account is created, AuthNode generates an RSA key pair for it.
Every certificate the institution issues has its fingerprint signed with the
institution's private key (RSA-PSS with SHA-256). During verification, AuthNode checks
that signature against the institution's public key. This proves the certificate
really was issued by that institution, and hasn't been re-signed by someone else.

Together, these two mechanisms mean a certificate can prove both **"I haven't been
changed"** and **"I really came from this institution"** — without anyone needing to
phone the registrar's office to ask.

## Is blockchain involved?

**Not in the current version.** AuthNode's certificate records, fingerprints, and
signatures are stored in a local SQLite database, not on a public blockchain. A
blockchain-anchored ledger and decentralized file storage (e.g. IPFS) are listed as
possible future directions, but they are not part of how the system works today. If
you're asking whether verification currently depends on a blockchain network — it
doesn't; it depends on the SHA-256 fingerprint and RSA signature described above.

## Is IPFS involved?

**No, not currently.** AuthNode does not store certificate PDFs on IPFS today —
certificate details are stored directly in AuthNode's own database. If IPFS-based
storage is added in the future, this document will be updated to reflect it.

## Why fingerprint + signature instead of "just a database record"?

A plain database record can be edited by anyone with access to the database, and
nothing about the record itself would reveal that it happened. A fingerprint tied to a
digital signature means an edited record no longer matches what was originally signed
— the inconsistency is detectable by recomputing the fingerprint and checking the
signature, which is exactly what happens every time someone verifies a certificate.

## Is AuthNode 100% fraud-proof?

No system can honestly claim that, and AuthNode doesn't. What it's designed to do is
make unauthorized modification of a certificate's details detectable, rather than
relying on the certificate simply looking legitimate.
