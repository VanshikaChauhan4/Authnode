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

from fastapi.middleware.cors import CORSMiddleware

from . import crypto_utils, security, blockchain

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

def get_current_user(
    request: Request,
):

    token = request.cookies.get(
        COOKIE_NAME
    )


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
# SIGNUP
# ============================================================

@app.post(
    "/api/auth/signup",

    response_model=SessionResponse,
)
def signup(
    body: SignupRequest,

    response: Response,
):

    name = body.name.strip()

    role = body.role


    now = int(
        time.time() * 1000
    )


    user_id = str(
        uuid.uuid4()
    )


    password_hash, password_salt = (
        security.hash_password(
            body.password
        )
    )


    private_key = None

    public_key = None


    # Only institutions get signing keys.
    #
    # Institutions are responsible for
    # cryptographically signing certificates.
    if role == "institution":

        private_key, public_key = (
            crypto_utils.generate_keypair()
        )
        private_key = security.encrypt_private_key(private_key)


    with get_connection() as conn:

        existing = conn.execute(

            """
            SELECT id

            FROM users

            WHERE lower(name) = lower(?)

            AND role = ?
            """,

            (
                name,
                role,
            ),

        ).fetchone()


        if existing:

            raise HTTPException(

                status_code=409,

                detail=(
                    "An account with this name "
                    "and role already exists — "
                    "sign in instead."
                ),
            )


        conn.execute(

            """
            INSERT INTO users (

                id,

                name,

                role,

                password_hash,

                password_salt,

                public_key,

                private_key,

                created_at

            )

            VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?
            )
            """,

            (

                user_id,

                name,

                role,

                password_hash,

                password_salt,

                public_key,

                private_key,

                now,

            ),
        )


    token = create_session(
        user_id
    )


    set_session_cookie(
        response,
        token,
    )


    return SessionResponse(

        name=name,

        role=role,
    )


# ============================================================
# LOGIN
# ============================================================

@app.post(
    "/api/auth/login",

    response_model=SessionResponse,
)
def login(
    body: LoginRequest,

    response: Response,
):

    name = body.name.strip()

    role = body.role


    with get_connection() as conn:

        row = conn.execute(

            """
            SELECT

                id,

                name,

                role,

                password_hash,

                password_salt

            FROM users

            WHERE lower(name) = lower(?)

            AND role = ?

            """,

            (
                name,
                role,
            ),

        ).fetchone()


    if not row:

        raise HTTPException(

            status_code=404,

            detail=(
                "No account found with "
                "that name and role — "
                "create one first."
            ),
        )


    password_ok = (
        security.verify_password(

            body.password,

            row["password_hash"],

            row["password_salt"],
        )
    )


    if not password_ok:

        raise HTTPException(

            status_code=401,

            detail="Incorrect password",
        )


    token = create_session(
        row["id"]
    )


    set_session_cookie(
        response,
        token,
    )


    return SessionResponse(

        name=row["name"],

        role=row["role"],
    )


# ============================================================
# LOGOUT
# ============================================================

@app.post(
    "/api/auth/logout"
)
def logout(
    response: Response,

    request: Request,
):

    token = request.cookies.get(
        COOKIE_NAME
    )


    if token:

        with get_connection() as conn:

            conn.execute(

                """
                DELETE FROM sessions
                WHERE token = ?
                """,

                (token,),
            )


    clear_session_cookie(
        response
    )


    return {

        "ok": True,
    }


# ============================================================
# CURRENT SESSION
# ============================================================

@app.get(
    "/api/auth/session",

    response_model=SessionResponse,
)
def session(
    user=Depends(
        get_current_user
    ),
):

    return SessionResponse(

        name=user["name"],

        role=user["role"],
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


@app.post("/api/certificates/verify-documents")
async def verify_two_documents(request: Request):
    """
    Final verification flow:

    email image OCR
          +
    certificate image OCR
          ↓
    document-to-document comparison
          ↓
    SQLite certificate lookup
          ↓
    SHA-256 verification
          ↓
    RSA signature verification
          ↓
    verified / rejected
    """

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON verification request",
        )

    email_data = body.get("email") or {}
    certificate_data = body.get("certificate") or {}

    email_id = str(email_data.get("certificateId") or "").strip()
    certificate_id = str(
        certificate_data.get("certificateId") or ""
    ).strip()

    email_name = str(email_data.get("studentName") or "").strip()
    certificate_name = str(
        certificate_data.get("studentName") or ""
    ).strip()

    email_address = str(
        email_data.get("studentEmail") or ""
    ).strip().lower()

    email_course = str(
        email_data.get("course") or ""
    ).strip()

    certificate_course = str(
        certificate_data.get("course") or ""
    ).strip()

    email_institution = str(
        email_data.get("institution") or ""
    ).strip()

    certificate_institution = str(
        certificate_data.get("institution") or ""
    ).strip()

    # --------------------------------------------------------
    # Required OCR data
    # --------------------------------------------------------

    if not email_id:
        return {
            "status": "document_mismatch",
            "reason": "email_certificate_id_missing",
            "message": (
                "The certificate ID could not be read from "
                "the certificate email."
            ),
        }

    if not certificate_id:
        return {
            "status": "document_mismatch",
            "reason": "certificate_id_missing",
            "message": (
                "The certificate ID could not be read from "
                "the certificate image."
            ),
        }

    if not email_name:
        return {
            "status": "document_mismatch",
            "reason": "email_name_missing",
            "message": (
                "The student name could not be read from "
                "the certificate email."
            ),
        }

    if not certificate_name:
        return {
            "status": "document_mismatch",
            "reason": "certificate_name_missing",
            "message": (
                "The student name could not be read from "
                "the certificate image."
            ),
        }

    # --------------------------------------------------------
    # Compare BOTH uploaded documents
    # --------------------------------------------------------

    if _normalize_verification_id(email_id) != _normalize_verification_id(
        certificate_id
    ):
        return {
            "status": "document_mismatch",
            "reason": "certificate_id_mismatch",
            "message": (
                "The Certificate ID in the certificate email "
                "does not match the Certificate ID on the "
                "certificate image."
            ),
            "emailCertificateId": email_id,
            "certificateId": certificate_id,
        }

    if not _names_match(email_name, certificate_name):
        return {
            "status": "document_mismatch",
            "reason": "student_name_mismatch",
            "message": (
                "The student name in the certificate email "
                "does not match the student name on the "
                "certificate image."
            ),
            "emailName": email_name,
            "certificateName": certificate_name,
        }

    # If both documents contain course/institution data,
    # compare them. Missing OCR data is tolerated because
    # layouts differ between emails and certificates.
    if (
        email_course
        and certificate_course
        and _normalize_verification_text(email_course)
        != _normalize_verification_text(certificate_course)
    ):
        return {
            "status": "document_mismatch",
            "reason": "course_mismatch",
            "message": (
                "The course shown in the certificate email "
                "does not match the certificate image."
            ),
        }

    if (
        email_institution
        and certificate_institution
        and _normalize_verification_text(email_institution)
        not in _normalize_verification_text(certificate_institution)
        and _normalize_verification_text(certificate_institution)
        not in _normalize_verification_text(email_institution)
    ):
        return {
            "status": "document_mismatch",
            "reason": "institution_mismatch",
            "message": (
                "The institution shown in the certificate "
                "email does not match the certificate image."
            ),
        }

    # --------------------------------------------------------
    # Find the authoritative certificate in SQLite
    # --------------------------------------------------------

    row = _lookup_certificate(certificate_id)

    if not row:
        return {
            "status": "not_found",
            "certificateId": certificate_id,
            "message": (
                "No certificate with this Certificate ID "
                "exists in the AuthNode database."
            ),
        }

    # --------------------------------------------------------
    # Compare both documents with the official DB record
    # --------------------------------------------------------

    official_id = str(row["id"] or "").strip()
    official_name = str(
        row["student_name"] or ""
    ).strip()
    official_email = str(
        row["student_email"] or ""
    ).strip().lower()
    official_course = str(
        row["course"] or ""
    ).strip()
    official_institution = str(
        row["institution"] or ""
    ).strip()

    if _normalize_verification_id(certificate_id) != _normalize_verification_id(
        official_id
    ):
        return {
            "status": "document_mismatch",
            "reason": "database_id_mismatch",
            "message": (
                "The Certificate ID from the uploaded documents "
                "does not match the official database record."
            ),
            "certificate": row_to_cert(row),
        }

    if not _names_match(certificate_name, official_name):
        return {
            "status": "name_mismatch",
            "reason": "database_name_mismatch",
            "message": (
                "The student name on the uploaded certificate "
                "does not match the official database record."
            ),
            "certificate": row_to_cert(row),
            "detectedName": certificate_name,
            "officialName": official_name,
        }

    # The email screenshot is specifically used to establish
    # that the certificate notification belongs to the same
    # official student record.
    if email_address and email_address != official_email:
        return {
            "status": "email_mismatch",
            "reason": "database_email_mismatch",
            "message": (
                "The email address in the certificate email "
                "does not match the official certificate record."
            ),
            "certificate": row_to_cert(row),
        }

    if (
        certificate_course
        and official_course
        and _normalize_verification_text(certificate_course)
        != _normalize_verification_text(official_course)
    ):
        return {
            "status": "course_mismatch",
            "reason": "database_course_mismatch",
            "message": (
                "The course on the uploaded certificate does "
                "not match the official database record."
            ),
            "certificate": row_to_cert(row),
        }

    if (
        certificate_institution
        and official_institution
        and _normalize_verification_text(certificate_institution)
        not in _normalize_verification_text(official_institution)
        and _normalize_verification_text(official_institution)
        not in _normalize_verification_text(certificate_institution)
    ):
        return {
            "status": "institution_mismatch",
            "reason": "database_institution_mismatch",
            "message": (
                "The institution on the uploaded certificate "
                "does not match the official database record."
            ),
            "certificate": row_to_cert(row),
        }

    # --------------------------------------------------------
    # Cryptographic verification
    # --------------------------------------------------------

    crypto_status = _cryptographically_verify_row(row)

    if crypto_status == "revoked":
        return {
            "status": "revoked",
            "certificate": row_to_cert(row),
            "certificateId": official_id,
            "message": "This certificate has been revoked.",
        }

    if crypto_status in {"tampered", "signature_invalid"}:
        return {
            "status": "signature_invalid" if crypto_status == "signature_invalid" else "tampered",
            "certificate": row_to_cert(row),
            "certificateId": official_id,
            "message": (
                "The certificate issuer signature is missing or invalid."
                if crypto_status == "signature_invalid" else
                "The certificate SHA-256 fingerprint does not match the official record."
            ),
        }

    chain_checks = {"blockchainEnabled": blockchain.is_enabled(), "blockchainRegistered": False}
    if blockchain.is_enabled():
        try:
            chain = blockchain.verify(official_id, row["hash"])
        except blockchain.BlockchainUnavailable:
            return {"status": "verification_error", "certificate": row_to_cert(row), "certificateId": official_id, "message": "Blockchain verification could not be completed. No genuine result is available."}
        chain_checks.update({"blockchainRegistered": bool(chain.get("exists")), "blockchainHashMatch": bool(chain.get("hashMatches")), "blockchainRevoked": bool(chain.get("revoked")), "blockchainNetwork": chain.get("network")})
        if not chain.get("exists"):
            return {"status": "not_registered", "certificate": row_to_cert(row), "certificateId": official_id, "checks": chain_checks, "message": "The certificate exists in the local record but is not registered on the configured blockchain."}
        if chain.get("revoked"):
            return {"status": "revoked", "certificate": row_to_cert(row), "certificateId": official_id, "checks": chain_checks, "message": "This certificate has been revoked on the blockchain."}
        if not chain.get("hashMatches"):
            return {"status": "tampered", "certificate": row_to_cert(row), "certificateId": official_id, "checks": chain_checks, "message": "The blockchain fingerprint does not match the certificate record."}

    return {
        "status": "verified",
        "certificate": row_to_cert(row),
        "certificateId": official_id,
        "checks": {
            "emailCertificateIdMatch": True,
            "emailCertificateNameMatch": True,
            "databaseCertificateIdMatch": True,
            "databaseStudentMatch": True,
            "databaseEmailMatch": True,
            "sha256Match": True,
            "rsaSignatureValid": True,
            **chain_checks,
        },
        "message": (
            "Certificate verified successfully. The email and certificate match, the official record and RSA signature passed. "
            + ("The blockchain registration also passed." if chain_checks["blockchainEnabled"] else "Blockchain is not enabled on this backend; this is a local cryptographic verification only.")
        ),
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


@app.post("/api/certificates/verify")
async def verify_uploaded_pdf(cert_id: str = Form(...), file: UploadFile = File(...)):
    """Verify the certificate record using its ID and return the uploaded PDF's
    independent digest for audit. This does not pretend PDF bytes equal the
    canonical certificate-data hash; PDF re-exports/scans change byte hashes.
    """
    if not cert_id.strip() or len(cert_id) > 80:
        raise HTTPException(status_code=400, detail="A valid certificate ID is required")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Upload a PDF certificate")
    contents = await file.read(10 * 1024 * 1024 + 1)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="PDF must be 10 MB or smaller")
    if not contents.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF")
    pdf_digest = __import__("hashlib").sha256(contents).hexdigest()
    result = await asyncio.to_thread(verify_certificate, cert_id)
    return {
        "certificate_id": cert_id,
        "verification_status": result.status,
        "certificate": result.entry.model_dump() if result.entry else None,
        "uploaded_pdf_sha256": pdf_digest,
        "blockchain_enabled": blockchain.is_enabled(),
        "blockchain_registered": blockchain.is_enabled() and result.status == "verified",
        "pdf_hash_semantics": "Audit fingerprint of the uploaded file only; it is not compared with the canonical certificate-data hash.",
    }
