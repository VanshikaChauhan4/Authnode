# AuthNode workflows

## Institution workflow
1. Open AuthNode and choose **Institution** on the sign-in screen.
2. Enter your institution name (e.g. Greenfield University).
3. Go to **Issue** and enter the student's name, course or credential, and issue date.
4. Click submit — AuthNode shows "Certificate secured" with a QR code.
5. Share the QR code or verification link with the student.

## Student workflow
1. Choose **Student** on sign-in and enter your name exactly as it appears on your certificate.
2. Open **Dashboard** to see all certificates issued to you.
3. Share the QR code or "Share verification link" button with employers.

## Employer / verifier workflow
1. Choose **Employer** or go directly to **Verify** (no sign-in required).
2. Scan the QR code or paste the certificate ID.
3. Read the result: **Verified**, **Not found**, or **Does not match**.

## Verification result meanings
- **Verified** — Certificate is authentic. Shows institution name and issue date.
- **Not found** — No matching certificate. Check the ID or ask the student for a fresh QR.
- **Does not match** — Record exists but integrity check failed. Do not trust the certificate.

## Trust explanation
Every certificate gets a unique fingerprint derived from its details. The institution digitally signs that fingerprint when issuing. Verification recomputes the fingerprint and checks the signature — if anything was changed after issuance, verification fails.
