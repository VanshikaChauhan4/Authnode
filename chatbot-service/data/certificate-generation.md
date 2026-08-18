# How AuthNode generates a certificate

Only accounts signed in with the **Institution** role can issue certificates.

## Step by step

1. **Sign in as an Institution.** Enter your institution's name (e.g. "Greenfield
   University"). AuthNode creates an RSA key pair for your account the first time you
   sign in — this key pair is what lets AuthNode prove a certificate really came from
   your institution.
2. **Go to the Issue page.** Enter the student's name, the course or credential name,
   and the issue date.
3. **Submit.** AuthNode does three things automatically:
   - Builds a canonical string from the student name, course, institution, and issue
     date.
   - Hashes that string with SHA-256 to produce a unique fingerprint.
   - Signs the fingerprint with the institution's private key (RSA-PSS with SHA-256).
4. **The certificate is saved**, along with its fingerprint, its signature, and a short
   Certificate ID (the first 12 characters of the fingerprint).
5. **A QR code is generated** linking to that Certificate ID, ready to hand to the
   student.

## What determines the fingerprint

The fingerprint is generated from exactly these fields, in this order: student name,
course, institution, and issue date. Changing any one of them — even a single
character or a capital letter — produces a completely different fingerprint. That's
what makes silent edits detectable later during verification.

## Can a certificate be re-issued with different details?

Yes — if any field changes, that's treated as a different certificate with its own new
fingerprint and Certificate ID. AuthNode will reject an attempt to issue an exact
duplicate (same student, course, institution, and date) if one already exists.
