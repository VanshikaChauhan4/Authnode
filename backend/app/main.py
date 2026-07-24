"""AuthNode certificate API — FastAPI + SQLite + RSA signing."""

from __future__ import annotations

import time
import uuid

from fastapi import Cookie, Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from . import crypto_utils
from .database import get_connection, init_db
from .schemas import (
    CertificateResponse,
    IssueCertificateRequest,
    LoginRequest,
    SessionResponse,
    SignupRequest,
    VerifyResponse,
)

SESSION_COOKIE = "authnode_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7

app = FastAPI(title="AuthNode API", version="1.0.0")

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


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def normalized(name: str) -> str:
    return " ".join(name.strip().split()).lower()


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, httponly=True, samesite="lax", secure=False)


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


def create_session(conn, user_id: str) -> str:
    token = crypto_utils.new_token()
    conn.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, int(time.time() * 1000)),
    )
    return token


def get_current_user(
    authorization: str | None = Header(default=None),
    session_cookie: str | None = Cookie(default=None, alias=SESSION_COOKIE),
):
    token = session_cookie
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")

    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT u.id, u.name, u.role, u.public_key, u.private_key
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()

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
    name = " ".join(body.name.strip().split())
    role = body.role
    private_key = None
    public_key = None
    if role == "institution":
        private_key, public_key = crypto_utils.generate_keypair()

    user_id = str(uuid.uuid4())
    now = int(time.time() * 1000)
    password_hash = crypto_utils.hash_password(body.password)

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE normalized_name = ? AND role = ?",
            (normalized(name), role),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Account already exists — sign in instead")
        conn.execute(
            """
            INSERT INTO users (id, name, normalized_name, role, password_hash, public_key, private_key, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, name, normalized(name), role, password_hash, public_key, private_key, now),
        )
        token = create_session(conn, user_id)

    set_session_cookie(response, token)
    return SessionResponse(token=None, name=name, role=role)


@app.post("/api/auth/login", response_model=SessionResponse)
def login(body: LoginRequest, response: Response):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, name, role, password_hash FROM users WHERE normalized_name = ? AND role = ?",
            (normalized(body.name), body.role),
        ).fetchone()
        if not row or not crypto_utils.verify_password(body.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid name, role, or password")
        token = create_session(conn, row["id"])

    set_session_cookie(response, token)
    return SessionResponse(token=None, name=row["name"], role=row["role"])


@app.post("/api/auth/logout")
def logout(response: Response, user=Depends(get_current_user)):
    with get_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (user["token"],))
    clear_session_cookie(response)
    return {"ok": True}


@app.get("/api/auth/session", response_model=SessionResponse)
def session(user=Depends(get_current_user)):
    return SessionResponse(token=None, name=user["name"], role=user["role"])


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
        existing = conn.execute("SELECT id FROM certificates WHERE id = ? OR hash = ?", (cert_id, cert_hash)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="A certificate with identical details already exists")
        conn.execute(
            """
            INSERT INTO certificates (id, hash, signature, student_name, course, institution, institution_id, issue_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (cert_id, cert_hash, signature, body.student_name.strip(), body.course.strip(), user["name"], user["id"], body.issue_date, now),
        )
        row = conn.execute("SELECT * FROM certificates WHERE id = ?", (cert_id,)).fetchone()
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
        row = conn.execute("SELECT * FROM certificates WHERE id = ?", (cert_id.strip(),)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return row_to_cert(row)


@app.get("/api/certificates/{cert_id}/verify", response_model=VerifyResponse)
def verify_certificate(cert_id: str):
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT c.*, u.public_key
            FROM certificates c
            JOIN users u ON u.id = c.institution_id
            WHERE c.id = ?
            """,
            (cert_id.strip(),),
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
    if recomputed != row["hash"] or not row["public_key"]:
        return VerifyResponse(status="tampered", entry=row_to_cert(row))
    if not crypto_utils.verify_signature(row["hash"], row["signature"], row["public_key"]):
        return VerifyResponse(status="tampered", entry=row_to_cert(row))
    return VerifyResponse(status="verified", entry=row_to_cert(row))
