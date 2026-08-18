# Institute guide

## Setting up

Sign in choosing the **Institution** role, and enter your institution's name. The
first time you sign in, AuthNode generates an RSA key pair for your account behind the
scenes — this is what lets AuthNode cryptographically prove certificates you issue
really came from you. You don't need to manage the keys yourself.

## Issuing a certificate

1. Go to the **Issue** page.
2. Enter the student's name, the course or credential, and the issue date.
3. Submit. AuthNode generates the certificate's fingerprint, signs it with your
   institution's key, and saves the record.
4. A Certificate ID and QR code are generated immediately — hand these to the student,
   or they'll see them on their own Dashboard if they sign in with the same name you
   entered.

## What information is stored

For each certificate: student name, course, institution name, issue date, the
SHA-256 fingerprint of those details, and the RSA signature over that fingerprint.
AuthNode does not currently store the certificate as a PDF file — it stores the
structured details plus the cryptographic proof derived from them.

## Why use AuthNode instead of a normal PDF or database record

- Certificates can't be silently edited after issuance without breaking the
  fingerprint/signature match, which is detectable by anyone verifying them.
- Employers can verify instantly themselves, without contacting your registrar's
  office for every request.
- You don't need to maintain a public verification portal yourself — AuthNode's Verify
  page does that for any certificate you issue.

## Checking certificates you've issued

Currently, verification happens from the student or employer side via the Verify
page, using the Certificate ID. There isn't a separate institution-only verification
tool documented at this time — if you need to confirm a specific certificate's status,
use the same Verify page with its Certificate ID.
