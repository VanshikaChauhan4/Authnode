# Troubleshooting

## "Not found" when verifying a certificate I believe is real

- Double-check every character of the Certificate ID — it's case-sensitive-looking
  but generated from a hash, so even one wrong character means a completely different
  ID.
- Confirm the certificate was actually issued through AuthNode, not just handed to you
  as a plain PDF from elsewhere.
- Ask the student to re-share their QR code or Certificate ID — copied links or old
  screenshots can go stale if a certificate was re-issued.

## "Does not match" / tampered result

This means AuthNode found a record with that ID, but the recomputed fingerprint or the
institution's signature no longer checks out. This is the system correctly flagging
that the certificate's details don't match what was originally signed at issuance —
treat it as unverified. There isn't a way to "fix" a certificate into passing this
check other than re-issuing it correctly from the institution side.

## I can't find my certificate on my Dashboard

Make sure you signed in with the **exact name** your institution used when issuing the
certificate to you (matching is not case-sensitive, but the name itself must match).
If your institution issued it under a slightly different name (e.g. a middle name
included or omitted), it won't appear under a different name.

## The chatbot doesn't know the answer to my question

If a question is about functionality that isn't documented — for example, something
not described in AuthNode's guides — the assistant will say so rather than guess.
That's intentional: it's better to say "I don't have documentation on that" than to
invent an answer about how the platform works.
