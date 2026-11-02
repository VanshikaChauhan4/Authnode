# AuthNode backend – what changed

## Login / signup (why you had to sign up again and again)
* Frontend sends **email**, backend wanted **name** → every login 422'd. Login and signup now accept email (name still works for old accounts).
* Signup stores the email; `/api/auth/login`, `/signup` return a `token`. The frontend keeps it in localStorage and sends `Authorization: Bearer`; the httpOnly cookie also still works.
* Added `/api/auth/me` (frontend called it; backend only had `/session`) so a browser refresh restores the account.
* Logout now deletes the server session. Sessions live in SQLite (30 days) and survive backend restarts.
* Names are no longer unique; email+role is the identity. Login/signup are rate-limited.

## Verification (`POST /api/certificates/verify-documents`)
* Certificate ID compared OCR-tolerantly (O/0, l/1, S/5…), then names (strict token match – no substring/70% rule), email vs official record, course/institution vs official record, SHA-256 recompute, RSA signature, blockchain (if enabled).
* Unreadable OCR → `manual_review` (never "verified", never a false "mismatch").
* Email must be readable and match the official record; course OR institution must corroborate.
* Result always includes `checks`; email-screenshot authenticity is reported as `not_verified` (it cannot be proven from a screenshot).
* PDF endpoint now reads the PDF text and requires ID + student name + course to match the signed record.

## Dashboard
* `GET /api/certificates/mine` → `{certificates, failedAttempts}`: certificates you verified (saved automatically, one row per certificate, with `verified_at`, attempts, checks) + certificates issued to your email. Fields: `certificate_title, institution, issue_date, hash, verification_status, verification_type, blockchain_tx_hash…`.
* New `verifications` table (+ migration, indexes). Existing DBs migrate automatically.
* Issue endpoint accepts camelCase (what React sends) and snake_case.

## Frontend (small patches in `frontend-patches/`, copy over frontend/src)
* `lib/api.js` – credentials, real logout.  `Verify.jsx` – sends the login token so results are saved, goes to dashboard after "verified".  `Dashboard.jsx` – shows status, verified time, SHA-256, tx.

## Run
```
pip install -r requirements.txt
python run.py
python -m pytest tests -q      # 10 tests
```
Not changed / needs your runtime testing: Tesseract OCR accuracy (frontend), Sepolia deployment, chatbot.
