# Why AuthNode

## For students

- One place to hold every certificate you've earned, instead of scattered PDFs.
- Share a certificate with a QR code or short ID — no need to send the original file.
- Employers can confirm it's real themselves, instead of you having to prove it.

## For institutions

- Issuing takes seconds: enter the details, AuthNode handles fingerprinting and
  signing automatically.
- Fewer manual verification requests landing on your registrar's office, since
  employers can self-serve through the Verify page.
- Certificates you issue carry your institution's own digital signature, so they can
  be traced back to you specifically.

## For employers / verifiers

- Verification takes seconds, not the days a phone call or email chain usually takes.
- No account needed — paste a Certificate ID or scan a QR code and get an answer.
- A "Verified" result is backed by cryptography (a fingerprint match and a valid
  institution signature), not just a certificate that looks legitimate.

## What makes this different from a normal PDF certificate

A PDF, on its own, doesn't prove anything about whether it's been altered since it was
created — anyone with basic editing tools can change the text and the file will look
just as legitimate. AuthNode ties every certificate's details to a fingerprint and a
digital signature, so an edited certificate produces a fingerprint that no longer
matches what was originally signed. That inconsistency is exactly what verification
checks for.

## An honest note on limits

AuthNode is designed to make unauthorized modification of a certificate's details
detectable — it does not claim to eliminate fraud entirely, and no system reasonably
can. It also currently depends on institutions accurately entering the right details
at issuance time; AuthNode can't catch an institution issuing an intentionally false
certificate, only detect changes made after issuance.
