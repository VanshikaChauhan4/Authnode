"""AuthNode certificate API — FastAPI + SQLite + RSA signing.

Sessions are stored securely using httpOnly cookies.
The session token is never exposed to JavaScript or localStorage.

Certificate flow:

Institution
    ↓
React frontend sends certificate details
    ↓
FastAPI receives request
    ↓
Backend identifies logged-in institution
    ↓
Canonical certificate data is created
    ↓
SHA-256 certificate hash is generated
    ↓
Unique certificate ID is generated
    ↓
Institution signs the certificate hash
    ↓
Certificate is stored in SQLite
    ↓
Blockchain fields are reserved for the next phase
    ↓
Certificate is returned to React
"""

from __future__ import annotations

import os
import time
import asyncio
import uuid

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    Response,
    UploadFile,
    File,
    Form,
)
from .ocr_service import run_ocr
from fastapi.middleware.cors import CORSMiddleware

from . import crypto_utils, security, blockchain, verification as vf

from .database import (
    get_connection,
    init_db,
)

from .schemas import (
    CertificateResponse,
    IssueCertificateRequest,
    LoginRequest,
    SessionResponse,
    SignupRequest,
    VerifyResponse,
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="AuthNode API",
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# SESSION CONFIGURATION
# ============================================================

COOKIE_NAME = "authnode_session"

SESSION_MAX_AGE_SECONDS = (
    60 * 60 * 24 * 30
)


IS_PRODUCTION = (
    os.environ.get(
        "AUTHNODE_ENV",
        "development",
    )
    == "production"
)


# ============================================================
# APPLICATION STARTUP
# ============================================================

@app.on_event("startup")
def on_startup() -> None:
    init_db()


# ============================================================
# DATABASE ROW → API RESPONSE
# ============================================================

def row_to_cert(
    row,
) -> CertificateResponse:

    return CertificateResponse(

        # Certificate identity
        id=row["id"],

        # Cryptographic proof
        hash=row["hash"],

        # Student
        student_name=row["student_name"],

        student_email=row["student_email"],

        # Certificate details
        course=row["course"],

        certificate_title=row["certificate_title"],

        # Issuer
        institution=row["institution"],

        institution_id=row["institution_id"],

        # Issue details
        issue_date=row["issue_date"],

        # Certificate lifecycle
        status=row["status"],

        verification_type=row["verification_type"],

        # Blockchain fields
        blockchain_tx_hash=
            row["blockchain_tx_hash"],

        blockchain_network=
            row["blockchain_network"],

        blockchain_timestamp=
            row["blockchain_timestamp"],

        # Internal timestamp
        created_at=row["created_at"],
    )


# ============================================================
# SESSION COOKIE FUNCTIONS
# ============================================================

def set_session_cookie(
    response: Response,
    token: str,
) -> None:

    response.set_cookie(

        key=COOKIE_NAME,

        value=token,

        httponly=True,

        secure=IS_PRODUCTION,

        samesite="lax",

        max_age=SESSION_MAX_AGE_SECONDS,

        path="/",
    )


def clear_session_cookie(
    response: Response,
) -> None:

    response.delete_cookie(

        key=COOKIE_NAME,

        path="/",
    )


# ============================================================
# CREATE SESSION
# ============================================================

def create_session(
    user_id: str,
) -> str:

    token = crypto_utils.new_token()

    now = int(
        time.time() * 1000
    )


    with get_connection() as conn:

        conn.execute(

            """
            INSERT INTO sessions (
                token,
                user_id,
                created_at
            )

            VALUES (?, ?, ?)
            """,

            (
                token,
                user_id,
                now,
            ),
        )


    return token


# ============================================================
# GET CURRENT LOGGED-IN USER
# ============================================================

def _extract_token(request: Request) -> str | None:
    """Session token from `Authorization: Bearer <token>` or the httpOnly cookie."""
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        bearer = auth[7:].strip()
        if bearer:
            return bearer
    return request.cookies.get(COOKIE_NAME)


def get_optional_user(request: Request):
    """Like get_current_user but returns None instead of raising."""
    try:
        return get_current_user(request)
    except HTTPException:
        return None


def get_current_user(
    request: Request,
):

    token = _extract_token(request)


    if not token:

        raise HTTPException(

            status_code=401,

            detail="Not signed in",
        )


    cutoff = (

        int(
            time.time() * 1000
        )

        -

        SESSION_MAX_AGE_SECONDS
        * 1000
    )


    with get_connection() as conn:

        row = conn.execute(

            """
            SELECT

                u.id,

                u.name,

                u.email,

                u.role,

                u.public_key,

                u.private_key,

                s.created_at

            FROM sessions s

            JOIN users u
                ON u.id = s.user_id

            WHERE s.token = ?

            """,

            (token,),
        ).fetchone()


        # Delete expired session
        if (
            row
            and row["created_at"] < cutoff
        ):

            conn.execute(

                """
                DELETE FROM sessions
                WHERE token = ?
                """,

                (token,),
            )


            row = None


    if not row:

        raise HTTPException(

            status_code=401,

            detail=(
                "Session expired — "
                "sign in again"
            ),
        )


    return {

        "id":
            row["id"],

        "name":
            row["name"],

        "email":
            row["email"],

        "role":
            row["role"],

        "public_key":
            row["public_key"],

        "private_key":
            security.decrypt_private_key(row["private_key"]),

        "token":
            token,
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {

        "status": "ok",

        "service":
            "authnode-api",
    }


# ============================================================
# SIMPLE IN-MEMORY RATE LIMITER (per client IP + bucket)
# ============================================================

import collections
import hashlib
import json
import threading

_rate_lock = threading.Lock()
_rate_hits: dict[str, collections.deque] = {}


def rate_limit(request: Request, bucket: str, limit: int, window: int = 60) -> None:
    ip = request.client.host if request.client else "unknown"
    key = f"{bucket}:{ip}"
    now = time.time()
    with _rate_lock:
        q = _rate_hits.setdefault(key, collections.deque())
        while q and q[0] < now - window:
            q.popleft()
        if len(q) >= limit:
            raise HTTPException(status_code=429, detail="Too many requests — please wait a minute and try again.")
        q.append(now)


def _session_payload(row, token: str) -> SessionResponse:
    return SessionResponse(
        id=row["id"], name=row["name"], email=row["email"], role=row["role"], token=token,
    )


# ============================================================
# SIGNUP
# ============================================================

@app.post("/api/auth/signup", response_model=SessionResponse)
def signup(body: SignupRequest, response: Response, request: Request):
    rate_limit(request, "signup", 10)
    name = body.name
    email = body.email
    role = body.role
    now = int(time.time() * 1000)
    user_id = str(uuid.uuid4())
    password_hash, password_salt = security.hash_password(body.password)

    private_key = None
    public_key = None
    if role == "institution":
        private_key, public_key = crypto_utils.generate_keypair()
        private_key = security.encrypt_private_key(private_key)

    with get_connection() as conn:
        if email:
            dup = conn.execute(
                "SELECT id FROM users WHERE lower(email) = ? AND role = ?", (email, role)
            ).fetchone()
        else:
            dup = conn.execute(
                "SELECT id FROM users WHERE lower(name) = lower(?) AND role = ? AND email IS NULL",
                (name, role),
            ).fetchone()
        if dup:
            raise HTTPException(
                status_code=409,
                detail="An account with this email and role already exists — sign in instead.",
            )
        conn.execute(
            """INSERT INTO users (id, name, email, role, password_hash, password_salt,
                                  public_key, private_key, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, name, email, role, password_hash, password_salt, public_key, private_key, now),
        )

    token = create_session(user_id)
    set_session_cookie(response, token)
    return SessionResponse(id=user_id, name=name, email=email, role=role, token=token)


# ============================================================
# LOGIN  (email OR name)
# ============================================================

@app.post("/api/auth/login", response_model=SessionResponse)
def login(body: LoginRequest, response: Response, request: Request):
    rate_limit(request, "login", 20)
    role = body.role

    with get_connection() as conn:
        rows = []
        if body.email:
            rows = conn.execute(
                "SELECT * FROM users WHERE lower(email) = ? AND role = ?", (body.email, role)
            ).fetchall()
        if not rows and body.name:
            rows = conn.execute(
                "SELECT * FROM users WHERE lower(name) = lower(?) AND role = ?", (body.name, role)
            ).fetchall()
        # Legacy accounts (created before emails existed) can still sign in by
        # typing their old name into the email box.
        if not rows and body.email:
            rows = conn.execute(
                "SELECT * FROM users WHERE lower(name) = lower(?) AND role = ?", (body.email, role)
            ).fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="No account found for that email and role — create one first.")

    row = next(
        (r for r in rows if security.verify_password(body.password, r["password_hash"], r["password_salt"])),
        None,
    )
    if row is None:
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = create_session(row["id"])
    set_session_cookie(response, token)
    return _session_payload(row, token)


# ============================================================
# LOGOUT
# ============================================================

@app.post("/api/auth/logout")
def logout(response: Response, request: Request):
    token = _extract_token(request)
    if token:
        with get_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    clear_session_cookie(response)
    return {"ok": True}


# ============================================================
# CURRENT SESSION  (/auth/session and /auth/me are the same)
# ============================================================

@app.get("/api/auth/session", response_model=SessionResponse)
@app.get("/api/auth/me", response_model=SessionResponse)
def session(user=Depends(get_current_user)):
    return SessionResponse(
        id=user["id"], name=user["name"], email=user.get("email"), role=user["role"], token=user["token"],
    )


# ============================================================
# ISSUE CERTIFICATE
# ============================================================

@app.post(
    "/api/certificates/issue",

    response_model=CertificateResponse,
)
def issue_certificate(

    body: IssueCertificateRequest,

    user=Depends(
        get_current_user
    ),
):

    # --------------------------------------------------------
    # SECURITY:
    # Only institutions can issue certificates.
    # --------------------------------------------------------

    if user["role"] != "institution":

        raise HTTPException(

            status_code=403,

            detail=(
                "Only institutions "
                "can issue certificates"
            ),
        )


    # --------------------------------------------------------
    # Institution must have a signing key.
    # --------------------------------------------------------

    if not user["private_key"]:

        raise HTTPException(

            status_code=500,

            detail=(
                "Institution signing key "
                "missing"
            ),
        )


    # ========================================================
    # STEP 1
    # NORMALIZE ALL CERTIFICATE DATA
    # ========================================================

    student_name = (
        body.student_name
        .strip()
    )


    student_email = (
        body.student_email
        .strip()
        .lower()
    )


    course = (
        body.course
        .strip()
    )


    certificate_title = (
        body.certificate_title
        .strip()
    )


    institution_name = (
        user["name"]
        .strip()
    )


    institution_id = (
        user["id"]
    )


    issue_date = (
        body.issue_date
        .strip()
    )

    # The legacy canonical format uses a pipe delimiter; reject delimiter
    # injection rather than allowing ambiguous field boundaries.
    if any("|" in value for value in (student_name, student_email, course, certificate_title, institution_name, issue_date)):
        raise HTTPException(status_code=422, detail="Certificate fields cannot contain the '|' character")

    status = (
        body.status
        .strip()
        .upper()
    )


    verification_type = (
        body.verification_type
        .strip()
        .upper()
    )
    if verification_type == "BLOCKCHAIN_NATIVE" and not blockchain.is_enabled():
        verification_type = "LOCAL_CRYPTOGRAPHIC"


    # ========================================================
    # STEP 2
    # CREATE CANONICAL CERTIFICATE STRING
    #
    # This exact structure is what we hash.
    #
    # IMPORTANT:
    # The verification endpoint must rebuild this exact string.
    # ========================================================

    canonical_certificate = "|".join(

        [

            student_name,

            student_email,

            course,

            certificate_title,

            institution_id,

            institution_name,

            issue_date,

        ]
    )


    # ========================================================
    # STEP 3
    # GENERATE SHA-256 FINGERPRINT
    # ========================================================

    cert_hash = (
        crypto_utils.fingerprint(
            canonical_certificate
        )
    )


    # ========================================================
    # STEP 4
    # GENERATE UNIQUE CERTIFICATE ID
    # ========================================================

    cert_id = (
        crypto_utils.cert_id_from_hash(
            cert_hash
        )
    )


    # ========================================================
    # STEP 5
    # INSTITUTION CRYPTOGRAPHIC SIGNATURE
    #
    # The institution's private key signs the certificate hash.
    # ========================================================

    signature = (
        crypto_utils.sign_hash(

            cert_hash,

            user["private_key"],

        )
    )


    # ========================================================
    # STEP 6
    # INTERNAL DATABASE TIMESTAMP
    # ========================================================

    now = int(
        time.time() * 1000
    )


    # ========================================================
    # STEP 7
    # REGISTER ON-CHAIN WHEN THE OPERATOR HAS CONFIGURED SEPOLIA.
    # No transaction is fabricated when blockchain is disabled.
    # ========================================================

    blockchain_tx_hash = None
    blockchain_network = None
    blockchain_timestamp = None

    # Check for duplicates before submitting an irreversible transaction.
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM certificates WHERE id = ? OR hash = ?",
            (cert_id, cert_hash),
        ).fetchone()

    if existing:
        raise HTTPException(status_code=409, detail="A certificate with identical details already exists")

    if blockchain.is_enabled():
        try:
            chain_result = blockchain.issue(cert_id, cert_hash)
            blockchain_tx_hash = chain_result["transactionHash"]
            blockchain_network = chain_result.get("network", "sepolia")
            blockchain_timestamp = chain_result.get("blockTimestamp")
        except blockchain.BlockchainUnavailable as exc:
            raise HTTPException(status_code=503, detail="Blockchain issuance failed; certificate was not issued. Check server configuration and logs.") from exc

    # ========================================================
    # STEP 8
    # SAVE CERTIFICATE IN DATABASE
    # ========================================================

    with get_connection() as conn:

        existing = conn.execute(

            """
            SELECT id

            FROM certificates

            WHERE id = ?

            OR hash = ?

            """,

            (
                cert_id,
                cert_hash,
            ),

        ).fetchone()


        if existing:

            raise HTTPException(

                status_code=409,

                detail=(
                    "A certificate with "
                    "identical details "
                    "already exists"
                ),
            )


        conn.execute(

            """
            INSERT INTO certificates (

                id,

                hash,

                signature,

                student_name,

                student_email,

                course,

                certificate_title,

                institution,

                institution_id,

                issue_date,

                status,

                verification_type,

                blockchain_tx_hash,

                blockchain_network,

                blockchain_timestamp,

                created_at

            )

            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )

            """,

            (

                cert_id,

                cert_hash,

                signature,

                student_name,

                student_email,

                course,

                certificate_title,

                institution_name,

                institution_id,

                issue_date,

                status,

                verification_type,

                blockchain_tx_hash,

                blockchain_network,

                blockchain_timestamp,

                now,

            ),
        )


        row = conn.execute(

            """
            SELECT *

            FROM certificates

            WHERE id = ?

            """,

            (cert_id,),

        ).fetchone()


    # ========================================================
    # STEP 9
    # RETURN FINAL CERTIFICATE TO REACT
    # ========================================================

    return row_to_cert(
        row
    )


# ============================================================
# STUDENT CERTIFICATES
# ============================================================

@app.get(
    "/api/certificates/student",

    response_model=list[
        CertificateResponse
    ],
)
def student_certificates(

    user=Depends(
        get_current_user
    ),
):

    if user["role"] != "student":

        raise HTTPException(

            status_code=403,

            detail=(
                "Student session required"
            ),
        )


    with get_connection() as conn:

        rows = conn.execute(

            """
            SELECT *

            FROM certificates

            WHERE
                lower(student_name)
                =
                lower(?)

            ORDER BY
                created_at DESC

            """,

            (
                user["name"],
            ),

        ).fetchall()


    return [

        row_to_cert(row)

        for row in rows

    ]


# ============================================================
# VERIFY TWO DOCUMENTS
# ============================================================
#
# The frontend OCRs:
#   1. certificate email image
#   2. certificate image
#
# This endpoint compares both OCR results with each other and
# then verifies the certificate against the authoritative
# SQLite record + SHA-256 + RSA signature.
#
# It intentionally accepts plain JSON instead of multipart
# uploads so no new python-multipart dependency is required.
# ============================================================

def _normalize_verification_text(value: str | None) -> str:
    return " ".join(
        "".join(
            ch.lower() if ch.isalnum() or ch.isspace() else " "
            for ch in str(value or "")
        ).split()
    )


def _normalize_verification_id(value: str | None) -> str:
    return "".join(
        ch.lower()
        for ch in str(value or "")
        if ch.isalnum()
    )


def _names_match(name_a: str | None, name_b: str | None) -> bool:
    a = _normalize_verification_text(name_a)
    b = _normalize_verification_text(name_b)

    if not a or not b:
        return False

    if a == b or a in b or b in a:
        return True

    a_words = set(a.split())
    b_words = set(b.split())

    if not a_words or not b_words:
        return False

    common = len(a_words & b_words)
    return common >= min(len(a_words), len(b_words)) * 0.7


def _lookup_certificate(cert_id: str):
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT c.*, u.public_key
            FROM certificates c
            LEFT JOIN users u
                ON u.id = c.institution_id
            WHERE c.id = ?
               OR lower(c.id) = lower(?)
            """,
            (cert_id.strip(), cert_id.strip()),
        ).fetchone()


def _cryptographically_verify_row(row):
    if row["status"] == "REVOKED":
        return "revoked"

    canonical_certificate = "|".join(
        [
            row["student_name"].strip(),
            row["student_email"].strip().lower(),
            row["course"].strip(),
            row["certificate_title"].strip(),
            row["institution_id"],
            row["institution"].strip(),
            row["issue_date"].strip(),
        ]
    )

    recomputed_hash = crypto_utils.fingerprint(canonical_certificate)

    if recomputed_hash != row["hash"]:
        return "tampered"

    if not row["public_key"] or not row["signature"]:
        return "signature_invalid"
    signature_ok = crypto_utils.verify_signature(
        row["hash"], row["signature"], row["public_key"],
    )
    if not signature_ok:
        return "signature_invalid"

    return "verified"


def _clean(d: dict, key: str) -> str:
    return str(d.get(key) or "").strip()


def _save_verification(user, *, certificate_id, status, reason, message, checks, extracted, fingerprint):
    """Persist an attempt for a logged-in user. Verified results are upserted
    (one row per user+certificate) so re-checking never creates duplicates."""
    if not user:
        return False
    now = int(time.time() * 1000)
    with get_connection() as conn:
        if status == "verified" and certificate_id:
            cur = conn.execute(
                """UPDATE verifications SET attempts = attempts + 1, verified_at = ?, message = ?,
                          checks_json = ?, extracted_json = ?, fingerprint = ?
                   WHERE user_id = ? AND certificate_id = ? AND status = 'verified'""",
                (now, message, json.dumps(checks), json.dumps(extracted), fingerprint, user["id"], certificate_id),
            )
            if cur.rowcount:
                return True
        conn.execute(
            """INSERT INTO verifications (user_id, certificate_id, status, reason, message,
                      checks_json, extracted_json, fingerprint, verified_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user["id"], certificate_id, status, reason, message,
             json.dumps(checks), json.dumps(extracted), fingerprint, now),
        )
    return True


@app.post("/api/certificates/verify-documents")
async def verify_two_documents(request: Request):
    """Verify a certificate using OCR data from the certificate image + email image.

    Pipeline
      1. both documents must expose the same Certificate ID (OCR-tolerant)
      2. student name must agree across both documents (strict token match)
      3. look the ID up in the official database
      4. certificate fields + email address must match the official record
      5. SHA-256 re-computation + RSA issuer signature
      6. blockchain registration / revocation (when enabled)
      7. result is saved to the signed-in student's verification history

    Statuses: verified | document_mismatch | name_mismatch | email_mismatch |
    course_mismatch | institution_mismatch | not_found | tampered |
    signature_invalid | revoked | not_registered | manual_review |
    verification_error
    """
    rate_limit(request, "verify", 40)
    user = get_optional_user(request)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON verification request")
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Invalid verification request")

    email_data = body.get("email") or {}
    cert_data = body.get("certificate") or {}
    if not isinstance(email_data, dict) or not isinstance(cert_data, dict):
        raise HTTPException(status_code=400, detail="Invalid verification request")

    extracted = {"email": email_data, "certificate": cert_data}
    fingerprint = hashlib.sha256(
        json.dumps(extracted, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()

    email_id, cert_id = _clean(email_data, "certificateId"), _clean(cert_data, "certificateId")
    email_name, cert_name = _clean(email_data, "studentName"), _clean(cert_data, "studentName")
    email_addr = _clean(email_data, "studentEmail").lower()
    cert_email = _clean(cert_data, "studentEmail").lower()
    email_course, cert_course = _clean(email_data, "course"), _clean(cert_data, "course")
    email_inst, cert_inst = _clean(email_data, "institution"), _clean(cert_data, "institution")

    checks: dict = {"emailAuthenticity": "not_verified"}

    def finish(status, message, reason=None, certificate=None, cert_id_value=None, **extra):
        saved = _save_verification(
            user, certificate_id=cert_id_value, status=status, reason=reason, message=message,
            checks=checks, extracted=extracted, fingerprint=fingerprint,
        )
        out = {"status": status, "message": message, "checks": checks, "saved": bool(saved)}
        if reason:
            out["reason"] = reason
        if certificate is not None:
            out["certificate"] = certificate
            out["certificateId"] = certificate.id if hasattr(certificate, "id") else cert_id_value
        elif cert_id:
            out["certificateId"] = cert_id
        out.update(extra)
        return out

    # ---- 1. OCR completeness: a failed read is NOT a mismatch -------------------------
    missing = [
        label for label, val in (
            ("certificate ID (certificate)", cert_id), ("certificate ID (email)", email_id),
            ("student name (certificate)", cert_name), ("student name (email)", email_name),
            ("student email (email)", email_addr),
        ) if not val
    ]
    if missing:
        return finish(
            "manual_review",
            "Some fields could not be read from the images: " + ", ".join(missing)
            + ". Correct them manually or upload clearer images.",
            reason="ocr_incomplete", missingFields=missing,
        )

    # ---- 2. document-to-document ------------------------------------------------------
    checks["emailCertificateIdMatch"] = vf.compare_ids(email_id, cert_id) == vf.MATCH
    if not checks["emailCertificateIdMatch"]:
        return finish(
            "document_mismatch",
            "The Certificate ID in the email does not match the ID on the certificate image.",
            reason="certificate_id_mismatch", emailCertificateId=email_id, certificateId=cert_id,
        )
    checks["emailCertificateNameMatch"] = vf.compare_names(email_name, cert_name) == vf.MATCH
    if not checks["emailCertificateNameMatch"]:
        return finish(
            "document_mismatch",
            "The student name in the email does not match the name on the certificate image.",
            reason="student_name_mismatch", emailName=email_name, certificateName=cert_name,
        )
    for label, a, b, fn in (("course", email_course, cert_course, vf.compare_phrase),
                            ("institution", email_inst, cert_inst, vf.compare_phrase)):
        if fn(a, b) == vf.MISMATCH:
            return finish(
                "document_mismatch",
                f"The {label} in the email does not match the certificate image.",
                reason=f"{label}_mismatch",
            )

    # ---- 3. official record -----------------------------------------------------------
    row = None
    for cand in vf.id_candidates(cert_id):
        row = _lookup_certificate(cand)
        if row:
            break
    if not row:
        return finish(
            "not_found", "No certificate with this ID exists in the AuthNode database.",
            reason="certificate_not_found",
        )
    official_id = row["id"]
    certificate = row_to_cert(row)
    checks["databaseCertificateIdMatch"] = True

    # ---- 4. documents vs official record ---------------------------------------------
    if vf.compare_names(cert_name, row["student_name"]) != vf.MATCH:
        return finish(
            "name_mismatch", "The student name on the certificate does not match the official record.",
            reason="database_name_mismatch", certificate=certificate, cert_id_value=official_id,
            detectedName=cert_name, officialName=row["student_name"],
        )
    checks["databaseStudentMatch"] = True

    if vf.compare_emails(email_addr, row["student_email"]) != vf.MATCH:
        return finish(
            "email_mismatch", "The student email in the email image does not match the official record.",
            reason="database_email_mismatch", certificate=certificate, cert_id_value=official_id,
        )
    if cert_email and vf.compare_emails(cert_email, row["student_email"]) == vf.MISMATCH:
        return finish(
            "email_mismatch", "The student email on the certificate does not match the official record.",
            reason="database_email_mismatch", certificate=certificate, cert_id_value=official_id,
        )
    checks["databaseEmailMatch"] = True

    course_res = max((vf.compare_phrase(c, row["course"]) for c in (cert_course, email_course) if c),
                     default=vf.MISSING, key=lambda r: {vf.MISMATCH: 0, vf.MISSING: 1, vf.MATCH: 2}[r])
    inst_res = max((vf.compare_phrase(c, row["institution"]) for c in (cert_inst, email_inst) if c),
                   default=vf.MISSING, key=lambda r: {vf.MISMATCH: 0, vf.MISSING: 1, vf.MATCH: 2}[r])
    if course_res == vf.MISMATCH:
        return finish("course_mismatch", "The course does not match the official record.",
                      reason="database_course_mismatch", certificate=certificate, cert_id_value=official_id)
    if inst_res == vf.MISMATCH:
        return finish("institution_mismatch", "The institution does not match the official record.",
                      reason="database_institution_mismatch", certificate=certificate, cert_id_value=official_id)
    checks["databaseCourseMatch"] = course_res == vf.MATCH
    checks["databaseInstitutionMatch"] = inst_res == vf.MATCH
    if course_res != vf.MATCH and inst_res != vf.MATCH:
        # ID + name + email agree, but nothing corroborates the content of the certificate
        return finish(
            "manual_review",
            "Course and institution could not be read from the documents, so the certificate cannot be fully confirmed.",
            reason="ocr_incomplete", certificate=certificate, cert_id_value=official_id,
            missingFields=["course", "institution"],
        )

    # ---- 5. SHA-256 + RSA ------------------------------------------------------------
    crypto_status = _cryptographically_verify_row(row)
    if crypto_status == "revoked":
        return finish("revoked", "This certificate has been revoked.", certificate=certificate, cert_id_value=official_id)
    if crypto_status in {"tampered", "signature_invalid"}:
        checks["sha256Match"] = crypto_status != "tampered"
        checks["rsaSignatureValid"] = False
        return finish(
            crypto_status,
            "The certificate issuer signature is missing or invalid." if crypto_status == "signature_invalid"
            else "The certificate SHA-256 fingerprint does not match the official record.",
            certificate=certificate, cert_id_value=official_id,
        )
    checks["sha256Match"] = True
    checks["rsaSignatureValid"] = True

    # ---- 6. blockchain ----------------------------------------------------------------
    checks["blockchainEnabled"] = blockchain.is_enabled()
    checks["blockchainRegistered"] = False
    if blockchain.is_enabled():
        try:
            chain = blockchain.verify(official_id, row["hash"])
        except blockchain.BlockchainUnavailable:
            return finish(
                "verification_error",
                "Blockchain verification could not be completed. No genuine result is available.",
                certificate=certificate, cert_id_value=official_id,
            )
        checks.update({
            "blockchainRegistered": bool(chain.get("exists")),
            "blockchainHashMatch": bool(chain.get("hashMatches")),
            "blockchainRevoked": bool(chain.get("revoked")),
            "blockchainNetwork": chain.get("network"),
        })
        if not chain.get("exists"):
            return finish("not_registered", "The certificate exists locally but is not registered on the configured blockchain.",
                          certificate=certificate, cert_id_value=official_id)
        if chain.get("revoked"):
            return finish("revoked", "This certificate has been revoked on the blockchain.",
                          certificate=certificate, cert_id_value=official_id)
        if not chain.get("hashMatches"):
            return finish("tampered", "The blockchain fingerprint does not match the certificate record.",
                          certificate=certificate, cert_id_value=official_id)

    message = (
        "Certificate verified. The email and certificate agree with each other and with the official record; "
        "the SHA-256 fingerprint and issuer RSA signature are valid. "
        + ("The blockchain registration also passed." if checks["blockchainEnabled"]
           else "Blockchain is not enabled on this backend, so this is a local cryptographic verification only.")
    )
    return finish("verified", message, certificate=certificate, cert_id_value=official_id,
                  verificationType="BLOCKCHAIN_NATIVE" if checks["blockchainRegistered"] else "LOCAL_CRYPTOGRAPHIC")


# ============================================================
# STUDENT DASHBOARD  (/certificates/mine)
# ============================================================
#
# Returns, newest first:
#   * every certificate the student verified through the Verify page
#     (persistent history, one row per certificate)
#   * every certificate issued to the student's account
#     (matched by email, with name only as a fallback for legacy rows)
# ============================================================

@app.get("/api/certificates/mine")
def my_certificates(user=Depends(get_current_user)):
    if user["role"] not in ("student", "employer"):
        raise HTTPException(status_code=403, detail="Student or employer session required")

    items: dict[str, dict] = {}
    with get_connection() as conn:
        verified = conn.execute(
            """SELECT v.certificate_id, v.status AS v_status, v.verified_at, v.attempts, v.checks_json,
                      c.*
               FROM verifications v JOIN certificates c ON c.id = v.certificate_id
               WHERE v.user_id = ? AND v.status = 'verified'
               ORDER BY v.verified_at DESC""",
            (user["id"],),
        ).fetchall()
        for r in verified:
            d = row_to_cert(r).model_dump()
            d.update(
                verification_status="verified", verified_at=r["verified_at"],
                verification_attempts=r["attempts"], source="verified_upload",
                checks=json.loads(r["checks_json"] or "{}"),
            )
            items[r["id"]] = d

        if user["role"] == "student":
            if user.get("email"):
                owned = conn.execute(
                    "SELECT * FROM certificates WHERE lower(student_email) = lower(?) ORDER BY created_at DESC",
                    (user["email"],),
                ).fetchall()
            else:
                owned = conn.execute(
                    "SELECT * FROM certificates WHERE lower(student_name) = lower(?) ORDER BY created_at DESC",
                    (user["name"],),
                ).fetchall()
            for r in owned:
                if r["id"] in items:
                    items[r["id"]]["source"] = "issued_and_verified"
                    continue
                d = row_to_cert(r).model_dump()
                d.update(
                    verification_status="revoked" if r["status"] == "REVOKED" else "issued",
                    verified_at=None, verification_attempts=0, source="issued", checks={},
                )
                items[r["id"]] = d

        failed = conn.execute(
            """SELECT status, reason, message, certificate_id, verified_at
               FROM verifications WHERE user_id = ? AND status != 'verified'
               ORDER BY verified_at DESC LIMIT 20""",
            (user["id"],),
        ).fetchall()

    certs = sorted(items.values(), key=lambda d: d.get("verified_at") or d["created_at"], reverse=True)
    return {
        "certificates": certs,
        "failedAttempts": [dict(f) for f in failed],
    }


# ============================================================
# GET CERTIFICATE BY ID
# ============================================================

@app.get(
    "/api/certificates/{cert_id}",

    response_model=CertificateResponse,
)
def get_certificate(
    cert_id: str,
):

    with get_connection() as conn:

        row = conn.execute(

            """
            SELECT *

            FROM certificates

            WHERE id = ?

            """,

            (
                cert_id.strip(),
            ),

        ).fetchone()


    if not row:

        raise HTTPException(

            status_code=404,

            detail=(
                "Certificate not found"
            ),
        )


    return row_to_cert(
        row
    )


# ============================================================
# VERIFY CERTIFICATE
# ============================================================

@app.get(
    "/api/certificates/{cert_id}/verify",
    response_model=VerifyResponse,
)
@app.get(
    "/api/certificates/verify/{cert_id}",
    response_model=VerifyResponse,
)
def verify_certificate(
    cert_id: str,
    studentName: str | None = None,
):

    cert_id = (
        cert_id.strip()
    )


    # --------------------------------------------------------
    # Get certificate and issuing institution's public key.
    # --------------------------------------------------------

    with get_connection() as conn:

        row = conn.execute(
            """
            SELECT

                c.*,

                u.public_key

            FROM certificates c

            LEFT JOIN users u
                ON u.id = c.institution_id

            WHERE c.id = ?
            OR lower(c.id) = lower(?)

            """,

            (cert_id, cert_id),

        ).fetchone()


    # --------------------------------------------------------
    # Certificate does not exist.
    # --------------------------------------------------------

    if not row:

        return VerifyResponse(

            status="not_found",

            entry=None,
        )


    # --------------------------------------------------------
    # Check student name if provided
    # --------------------------------------------------------
    if studentName and studentName.strip():
        req_name = "".join(ch for ch in studentName.lower() if ch.isalnum() or ch.isspace()).strip()
        db_name = "".join(ch for ch in row["student_name"].lower() if ch.isalnum() or ch.isspace()).strip()
        if req_name and db_name:
            req_words = set(req_name.split())
            db_words = set(db_name.split())
            matched = (
                req_name == db_name
                or req_name in db_name
                or db_name in req_name
                or len(req_words & db_words) >= min(len(req_words), len(db_words)) * 0.5
            )
            if not matched:
                return VerifyResponse(
                    status="name_mismatch",
                    entry=row_to_cert(row),
                )


    # --------------------------------------------------------
    # Certificate revoked.
    # --------------------------------------------------------

    if (
        row["status"]
        ==
        "REVOKED"
    ):

        return VerifyResponse(

            status="revoked",

            entry=row_to_cert(row),
        )


    # ========================================================
    # STEP 1
    # REBUILD THE ORIGINAL CANONICAL CERTIFICATE
    #
    # It MUST use the exact same order as issuance.
    # ========================================================

    canonical_certificate = "|".join(

        [

            row["student_name"]
            .strip(),

            row["student_email"]
            .strip()
            .lower(),

            row["course"]
            .strip(),

            row["certificate_title"]
            .strip(),

            row["institution_id"],

            row["institution"]
            .strip(),

            row["issue_date"]
            .strip(),

        ]
    )


    # ========================================================
    # STEP 2
    # GENERATE HASH AGAIN
    # ========================================================

    recomputed_hash = (

        crypto_utils.fingerprint(

            canonical_certificate

        )
    )


    # ========================================================
    # STEP 3
    # CHECK HASH
    #
    # If database certificate data has been modified,
    # the generated hash will not match.
    # ========================================================

    if (

        recomputed_hash

        !=

        row["hash"]

    ):

        return VerifyResponse(

            status="tampered",

            entry=row_to_cert(row),
        )


    # ========================================================
    # STEP 4 & 5
    # VERIFY RSA SIGNATURE (IF PUBLIC KEY AVAILABLE)
    # ========================================================

    if not row["public_key"] or not row["signature"]:
        return VerifyResponse(status="signature_invalid", entry=row_to_cert(row))
    signature_ok = crypto_utils.verify_signature(row["hash"], row["signature"], row["public_key"])
    if not signature_ok:
        return VerifyResponse(status="signature_invalid", entry=row_to_cert(row))


    # ========================================================
    # STEP 6
    # BLOCKCHAIN VERIFICATION
    #
    # This will be added in the next phase.
    #
    # Future flow:
    #
    # row["hash"]
    #      ↓
    # Smart contract lookup
    #      ↓
    # Compare on-chain hash
    #      ↓
    # blockchain_verified
    # ========================================================


    # ========================================================
    # STEP 7
    # EVERYTHING PASSED
    # ========================================================

    if blockchain.is_enabled():
        try:
            chain_result = blockchain.verify(cert_id, row["hash"])
        except blockchain.BlockchainUnavailable:
            return VerifyResponse(status="verification_error", entry=row_to_cert(row))
        if not chain_result.get("exists"):
            return VerifyResponse(status="not_registered", entry=row_to_cert(row))
        if chain_result.get("revoked"):
            return VerifyResponse(status="revoked", entry=row_to_cert(row))
        if not chain_result.get("hashMatches"):
            return VerifyResponse(status="tampered", entry=row_to_cert(row))

    return VerifyResponse(status="verified", entry=row_to_cert(row))

# ============================================================
# BLOCKCHAIN STATUS, REVOCATION, AND PDF VERIFICATION API
# ============================================================

@app.get("/api/certificates/{cert_id}/status")
def certificate_status(cert_id: str):
    row = _lookup_certificate(cert_id)
    if not row:
        return {"certificate_id": cert_id, "status": "NOT_FOUND", "registered_on_blockchain": False}
    local_status = _cryptographically_verify_row(row)
    payload = {
        "certificate_id": row["id"],
        "status": local_status.upper(),
        "local_crypto_verified": local_status == "verified",
        "sha256": row["hash"],
        "issuer": row["institution"],
        "issuer_id": row["institution_id"],
        "blockchain_enabled": blockchain.is_enabled(),
        "registered_on_blockchain": False,
        "blockchain_network": row["blockchain_network"],
        "transaction_hash": row["blockchain_tx_hash"],
        "revoked": row["status"] == "REVOKED",
    }
    if blockchain.is_enabled():
        try:
            chain = blockchain.get(row["id"])
            payload.update({
                "registered_on_blockchain": bool(chain.get("exists")),
                "blockchain_hash_matches": chain.get("hash", "").lower() == ("0x" + row["hash"]).lower(),
                "issuer_address": chain.get("issuerAddress"),
                "blockchain_revoked": bool(chain.get("revoked")),
                "blockchain_issued_at": chain.get("issuedAt"),
                "blockchain_revoked_at": chain.get("revokedAt"),
            })
            if chain.get("revoked"):
                payload["status"] = "REVOKED"
            elif not chain.get("exists"):
                payload["status"] = "NOT_REGISTERED"
            elif not payload["blockchain_hash_matches"]:
                payload["status"] = "TAMPERED"
        except blockchain.BlockchainUnavailable as exc:
            payload.update({"status": "VERIFICATION_ERROR", "blockchain_error": "Blockchain provider unavailable; check server logs."})
    return payload


@app.post("/api/certificates/{cert_id}/revoke")
def revoke_certificate(cert_id: str, user=Depends(get_current_user)):
    if user["role"] != "institution":
        raise HTTPException(status_code=403, detail="Only institutions can revoke certificates")
    row = _lookup_certificate(cert_id)
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if row["institution_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only revoke certificates issued by your institution")
    if not blockchain.is_enabled():
        raise HTTPException(status_code=503, detail="Blockchain is not configured; revocation cannot be recorded on-chain")
    try:
        result = blockchain.revoke(row["id"])
    except blockchain.BlockchainUnavailable as exc:
        raise HTTPException(status_code=503, detail="Blockchain revocation failed. Check server configuration and logs.") from exc
    with get_connection() as conn:
        conn.execute("UPDATE certificates SET status = 'REVOKED', blockchain_tx_hash = ?, blockchain_network = 'sepolia' WHERE id = ?", (result["transactionHash"], row["id"]))
    return {"certificate_id": row["id"], "status": "REVOKED", "transaction_hash": result["transactionHash"], "network": "sepolia"}


def _pdf_text(contents: bytes) -> str | None:
    try:
        import io
        from pypdf import PdfReader
    except Exception:
        return None
    try:
        reader = PdfReader(io.BytesIO(contents))
        return " ".join((p.extract_text() or "") for p in reader.pages[:10])
    except Exception:
        return None


@app.post("/api/certificates/verify")
async def verify_uploaded_document(
    request: Request,
    cert_id: str = Form(...),
    file: UploadFile = File(...),
):
    """Verify a certificate uploaded as PDF or JPEG/JPG.

    The registered certificate's RSA/SHA-256 status is checked first.
    The uploaded document is then checked for the certificate ID,
    student name, and course using PDF text extraction or image OCR.
    """
    rate_limit(request, "verify", 40)
    user = get_optional_user(request)
    cert_id = cert_id.strip()

    if not cert_id or len(cert_id) > 80:
        raise HTTPException(status_code=400, detail="A valid certificate ID is required")

    contents = await file.read(10 * 1024 * 1024 + 1)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="The certificate file must be 10 MB or smaller")

    filename = (file.filename or "").lower()
    is_pdf = contents.startswith(b"%PDF-") and (
        file.content_type == "application/pdf" or filename.endswith(".pdf")
    )
    is_jpeg = contents.startswith(b"\xff\xd8\xff") and (
        file.content_type in {"image/jpeg", "image/jpg"}
        or filename.endswith((".jpg", ".jpeg"))
    )

    if not is_pdf and not is_jpeg:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file. Upload a valid PDF or JPG/JPEG certificate.",
        )

    file_digest = hashlib.sha256(contents).hexdigest()
    row = None
    for candidate in vf.id_candidates(cert_id):
        row = await asyncio.to_thread(_lookup_certificate, candidate)
        if row:
            break

    base = {
        "certificate_id": cert_id,
        "uploaded_file_sha256": file_digest,
        # Kept temporarily for compatibility with older frontend builds.
        "uploaded_pdf_sha256": file_digest,
        "file_type": "pdf" if is_pdf else "jpeg",
        "blockchain_enabled": blockchain.is_enabled(),
    }

    if not row:
        return {**base, "verification_status": "not_found", "certificate": None}

    result = await asyncio.to_thread(verify_certificate, row["id"])
    status = result.status
    extracted_text = ""
    text_readable = False

    if status == "verified":
        try:
            if is_pdf:
                extracted_text = await asyncio.to_thread(_pdf_text, contents) or ""
            else:
                ocr_result = await asyncio.to_thread(run_ocr, contents)
                extracted_text = (ocr_result or {}).get("text", "")

            text_readable = bool(extracted_text.strip())
        except Exception:
            # An OCR/extraction failure must never be treated as a pass.
            extracted_text = ""
            text_readable = False

        if not text_readable:
            status = "manual_review"

    content_checks = {
        "documentTextReadable": text_readable,
        "documentContainsCertificateId": False,
        "documentContainsStudentName": False,
        "documentContainsCourse": False,
    }

    if status == "verified" and text_readable:
        normalized_text = vf.normalize_text(extracted_text)
        compact_text = vf.normalize_cert_id(extracted_text)
        content_checks.update({
            "documentContainsCertificateId": (
                vf.normalize_cert_id(row["id"]) in compact_text
            ),
            "documentContainsStudentName": (
                vf.normalize_text(row["student_name"]) in normalized_text
            ),
            "documentContainsCourse": (
                vf.normalize_text(row["course"]) in normalized_text
            ),
        })

        if not all(content_checks.values()):
            status = "tampered"

    saved = _save_verification(
        user,
        certificate_id=row["id"],
        status="verified" if status == "verified" else status,
        reason="document_upload_jpeg" if is_jpeg else "document_upload_pdf",
        message=f"Uploaded document verification: {status}",
        checks=content_checks,
        extracted={"file_sha256": file_digest, "file_type": base["file_type"]},
        fingerprint=file_digest,
    )

    return {
        **base,
        "certificate_id": row["id"],
        "verification_status": status,
        "certificate": result.entry.model_dump() if result.entry else None,
        "content_checks": content_checks,
        "saved": bool(saved),
        "blockchain_registered": blockchain.is_enabled() and status == "verified",
        "file_hash_semantics": (
            "The uploaded PDF text or JPG image OCR text is compared with the signed official record; "
            "the uploaded file byte digest is stored for audit."
        ),
        # Backwards-compatible response field for older frontend builds.
        "pdf_hash_semantics": (
            "The uploaded document text is compared with the signed official record; "
            "the uploaded file byte digest is stored for audit."
        ),
    }

