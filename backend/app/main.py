"""AuthNode certificate API — FastAPI + SQLite + RSA signing.

Sessions are httpOnly cookies (never exposed to JS / localStorage). The
opaque session token lives only in the cookie and in the server-side
`sessions` table.
"""

from __future__ import annotations

import os
import time
import uuid

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from . import crypto_utils, security
from .database import get_connection, init_db
from .schemas import (
    CertificateResponse,
    IssueCertificateRequest,
    LoginRequest,
    SessionResponse,
    SignupRequest,
    VerifyResponse,
)

app = FastAPI(title="AuthNode API", version="1.1.0")

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

COOKIE_NAME = "authnode_session"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30  # 30 days
# Set AUTHNODE_ENV=production (behind HTTPS) to mark the cookie Secure.
IS_PRODUCTION = os.environ.get("AUTHNODE_ENV", "development") == "production"


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def row_to_cert(row) -> CertificateResponse:
    return CertificateResponse(
        id=row["id"],
        hash=row["hash"],
        student_name=row["student_name"],
        course=row["course"],
        institution=row["institution"],
        issue_date=row["issue_date"],
        created_at=row["created_at"],
    )


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=SESSION_MAX_AGE_SECONDS,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


def create_session(user_id: str) -> str:
    token = crypto_utils.new_token()
    now = int(time.time() * 1000)
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, now),
        )
    return token


def get_current_user(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")

    cutoff = int(time.time() * 1000) - SESSION_MAX_AGE_SECONDS * 1000
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT u.id, u.name, u.role, u.public_key, u.private_key, s.created_at
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()

        if row and row["created_at"] < cutoff:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            row = None

    if not row:
        raise HTTPException(status_code=401, detail="Session expired — sign in again")

    return {
        "id": row["id"],
        "name": row["name"],
        "role": row["role"],
        "public_key": row["public_key"],
        "private_key": row["private_key"],
        "token": token,
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "authnode-api"}


@app.post("/api/auth/signup", response_model=SessionResponse)
def signup(body: SignupRequest, response: Response):
    name = body.name.strip()
    role = body.role
    now = int(time.time() * 1000)
    user_id = str(uuid.uuid4())
    password_hash, password_salt = security.hash_password(body.password)

    private_key = None
    public_key = None
    if role == "institution":
        private_key, public_key = crypto_utils.generate_keypair()

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE lower(name) = lower(?) AND role = ?",
            (name, role),
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=409,
                detail="An account with this name and role already exists — sign in instead.",
            )

        conn.execute(
            """
            INSERT INTO users (id, name, role, password_hash, password_salt, public_key, private_key, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, name, role, password_hash, password_salt, public_key, private_key, now),
        )

    token = create_session(user_id)
    set_session_cookie(response, token)
    return SessionResponse(name=name, role=role)


@app.post("/api/auth/login", response_model=SessionResponse)
def login(body: LoginRequest, response: Response):
    name = body.name.strip()
    role = body.role

    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, name, role, password_hash, password_salt FROM users "
            "WHERE lower(name) = lower(?) AND role = ?",
            (name, role),
        ).fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="No account found with that name and role — create one first.",
        )

    if not security.verify_password(body.password, row["password_hash"], row["password_salt"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = create_session(row["id"])
    set_session_cookie(response, token)
    return SessionResponse(name=row["name"], role=row["role"])


@app.post("/api/auth/logout")
def logout(response: Response, request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        with get_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    clear_session_cookie(response)
    return {"ok": True}


@app.get("/api/auth/session", response_model=SessionResponse | None)
def session(user=Depends(get_current_user)):
    return SessionResponse(name=user["name"], role=user["role"])


@app.post("/api/certificates/issue", response_model=CertificateResponse)
def issue_certificate(body: IssueCertificateRequest, user=Depends(get_current_user)):
    if user["role"] != "institution":
        raise HTTPException(status_code=403, detail="Only institutions can issue certificates")

    if not user["private_key"]:
        raise HTTPException(status_code=500, detail="Institution signing key missing")

    cert_string = crypto_utils.build_cert_string(
        student_name=body.student_name,
        course=body.course,
        institution=user["name"],
        issue_date=body.issue_date,
    )
    cert_hash = crypto_utils.fingerprint(cert_string)
    cert_id = crypto_utils.cert_id_from_hash(cert_hash)
    signature = crypto_utils.sign_hash(cert_hash, user["private_key"])
    now = int(time.time() * 1000)

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM certificates WHERE id = ? OR hash = ?",
            (cert_id, cert_hash),
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=409,
                detail="A certificate with identical details already exists",
            )

        conn.execute(
            """
            INSERT INTO certificates (
                id, hash, signature, student_name, course,
                institution, institution_id, issue_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cert_id,
                cert_hash,
                signature,
                body.student_name.strip(),
                body.course.strip(),
                user["name"],
                user["id"],
                body.issue_date,
                now,
            ),
        )

        row = conn.execute(
            "SELECT * FROM certificates WHERE id = ?", (cert_id,)
        ).fetchone()

    return row_to_cert(row)


@app.get("/api/certificates/student", response_model=list[CertificateResponse])
def student_certificates(user=Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student session required")

    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM certificates
            WHERE lower(student_name) = lower(?)
            ORDER BY created_at DESC
            """,
            (user["name"],),
        ).fetchall()

    return [row_to_cert(r) for r in rows]


@app.get("/api/certificates/{cert_id}", response_model=CertificateResponse)
def get_certificate(cert_id: str):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM certificates WHERE id = ?", (cert_id.strip(),)
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")

    return row_to_cert(row)


@app.get("/api/certificates/{cert_id}/verify", response_model=VerifyResponse)
def verify_certificate(cert_id: str):
    cert_id = cert_id.strip()

    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT c.*, u.public_key
            FROM certificates c
            JOIN users u ON u.id = c.institution_id
            WHERE c.id = ?
            """,
            (cert_id,),
        ).fetchone()

    if not row:
        return VerifyResponse(status="not_found", entry=None)

    cert_string = crypto_utils.build_cert_string(
        student_name=row["student_name"],
        course=row["course"],
        institution=row["institution"],
        issue_date=row["issue_date"],
    )
    recomputed = crypto_utils.fingerprint(cert_string)

    if recomputed != row["hash"]:
        return VerifyResponse(status="tampered", entry=row_to_cert(row))

    if not row["public_key"]:
        return VerifyResponse(status="tampered", entry=row_to_cert(row))

    signature_ok = crypto_utils.verify_signature(
        row["hash"], row["signature"], row["public_key"]
    )

    if not signature_ok:
        return VerifyResponse(status="tampered", entry=row_to_cert(row))

    return VerifyResponse(status="verified", entry=row_to_cert(row))
