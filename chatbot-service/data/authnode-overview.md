# What is AuthNode?

AuthNode is a certificate verification platform. It helps three kinds of people:

- **Institutions** issue digital certificates to students.
- **Students** hold and share the certificates they've earned.
- **Employers / verifiers** check whether a certificate is genuine, in seconds, without calling anyone.

## The problem AuthNode solves

A normal certificate is a PDF or a printed document. Once it leaves the institution's
hands, there's no fast way for anyone else to confirm it's real and unaltered. Checking
usually means a phone call or email to the registrar's office, and waiting days or weeks
for a reply.

## How AuthNode fixes this

When an institution issues a certificate through AuthNode, the system:

1. Takes the certificate's details (student name, course, institution, issue date).
2. Generates a unique digital fingerprint from those details (a SHA-256 hash).
3. Has the issuing institution digitally sign that fingerprint with its own private key
   (an RSA signature).
4. Saves the certificate record, its fingerprint, and its signature.
5. Gives the student a Certificate ID and a QR code they can share with anyone.

Anyone holding that Certificate ID or QR code can then check it on the Verify page.
AuthNode recomputes the fingerprint from the stored details and checks the institution's
signature — if either doesn't match, the certificate is flagged as unverified.

## In one sentence

AuthNode turns "trust me, this certificate is real" into "check it yourself, in under two
seconds."
