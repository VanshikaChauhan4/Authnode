# AuthNode knowledge base for the RAG assistant

## What is AuthNode?
AuthNode is a certificate verification platform. Every certificate gets a unique digital fingerprint. If even one letter in the certificate details changes, the fingerprint changes completely — making tampering easy to detect.

## How do I verify a certificate?
Go to the Verify page and paste the certificate ID from a QR code, or scan the QR code on your phone. AuthNode checks whether the certificate is real and shows a clear green "Verified" or red "Could not verify" result.

## Why is my certificate not verifying?
Common reasons:
- The certificate ID was typed incorrectly — double-check every character.
- The certificate was never issued through AuthNode.
- Someone edited the certificate details after it was issued, which breaks the fingerprint match.
- You are using an old or copied QR link that does not match any record.

## What does "Verified" mean?
It means AuthNode found a matching record, the fingerprint still matches the stored details, and the institution's digital signature is valid. The certificate has not been altered since it was issued.

## What does "Not found" mean?
No certificate in the database matches that ID. Ask the student to re-share their QR code or contact the issuing institution.

## What does "Does not match" mean?
A record exists but the fingerprint or signature no longer matches. Treat the certificate as unverified — it may have been tampered with.

## How do institutions issue certificates?
Sign in as an Institution, fill in the student name, course, and issue date, then submit. AuthNode generates a fingerprint, signs it with the institution's key, and saves it permanently. The student receives a QR code they can share with employers.

## How do students view their certificates?
Sign in as a Student with the same name used when the certificate was issued. All matching certificates appear on the Dashboard with QR codes and share links.

## Is my data stored securely?
Certificate records are stored in a local SQLite database with cryptographic fingerprints and RSA signatures. Once issued, records cannot be silently edited without breaking verification.

## Do I need an API key or payment?
No. AuthNode runs entirely locally for this demo — free embeddings, a local LLM via Ollama, and Chroma for document search.

## What is a digital fingerprint?
Think of it like a tamper-evident seal. AuthNode creates a unique code from the certificate details. Change anything — even a single letter — and the code changes too.

## Can employers verify without signing in?
Yes. Go to Verify and enter or scan the certificate ID. No account is required.
