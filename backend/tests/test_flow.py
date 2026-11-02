import os, tempfile, importlib
import pytest

@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path/'t.db'}")
    monkeypatch.setenv("AUTHNODE_ENV", "development")
    import app.database as db; importlib.reload(db)
    import app.main as main; importlib.reload(main)
    main.blockchain.is_enabled = lambda: False
    from fastapi.testclient import TestClient
    with TestClient(main.app) as c:
        yield c

def _signup(c, **kw):
    r = c.post("/api/auth/signup", json=kw); assert r.status_code == 200, r.text
    return r.json()

def _setup(c):
    inst = _signup(c, name="Tech University", email="admin@tech.edu", role="institution", password="password123")
    h = {"Authorization": f"Bearer {inst['token']}"}
    r = c.post("/api/certificates/issue", headers=h, json={
        "studentName": "Priya Sharma", "studentEmail": "priya@mail.com", "course": "Data Science",
        "issueDate": "2026-05-01"})
    assert r.status_code == 200, r.text
    return r.json()

def _docs(cert, **over):
    base = {"certificateId": cert["id"], "studentName": "Priya Sharma", "course": "Data Science",
            "institution": "Tech University"}
    email = {**base, "studentEmail": "priya@mail.com"}
    certd = {**base}
    return {"email": {**email, **over.get("email", {})}, "certificate": {**certd, **over.get("certificate", {})}}

def test_login_by_email_persists_and_logout(client):
    _signup(client, name="Priya", email="Priya@Mail.com", role="student", password="password123")
    r = client.post("/api/auth/login", json={"email": "priya@mail.com", "role": "student", "password": "password123"})
    assert r.status_code == 200 and r.json()["token"]
    tok = r.json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    assert client.get("/api/auth/me", headers=h).json()["email"] == "priya@mail.com"
    assert client.get("/api/auth/session", headers=h).status_code == 200
    assert client.post("/api/auth/login", json={"email": "priya@mail.com", "role": "student", "password": "bad-pass-1"}).status_code == 401
    client.post("/api/auth/logout", headers=h)
    assert client.get("/api/auth/me", headers=h).status_code == 401

def test_verified_certificate_lands_in_dashboard(client):
    cert = _setup(client)
    s = _signup(client, name="Priya Sharma", email="priya@mail.com", role="student", password="password123")
    h = {"Authorization": f"Bearer {s['token']}"}
    docs = _docs(cert)
    docs["certificate"]["certificateId"] = cert["id"].upper().replace("0", "O")   # OCR slip
    r = client.post("/api/certificates/verify-documents", json=docs, headers=h).json()
    assert r["status"] == "verified" and r["saved"] is True, r
    assert r["checks"]["sha256Match"] and r["checks"]["rsaSignatureValid"]
    # re-verifying must not duplicate
    client.post("/api/certificates/verify-documents", json=_docs(cert), headers=h)
    mine = client.get("/api/certificates/mine", headers=h).json()["certificates"]
    assert len(mine) == 1
    assert mine[0]["verification_status"] == "verified" and mine[0]["verified_at"]
    assert mine[0]["verification_attempts"] == 2 and mine[0]["certificate_title"]

def test_rejections(client):
    cert = _setup(client)
    v = lambda d: client.post("/api/certificates/verify-documents", json=d).json()["status"]
    assert v(_docs(cert, email={"studentName": "Priya Verma"})) == "document_mismatch"
    assert v(_docs(cert, email={"studentEmail": "evil@mail.com"})) == "email_mismatch"
    assert v(_docs(cert, certificate={"course": "Cooking"}, email={"course": "Cooking"})) == "course_mismatch"
    assert v(_docs(cert, email={"studentEmail": ""})) == "manual_review"
    assert v(_docs(cert, certificate={"certificateId": ""})) == "manual_review"
    other = {"certificateId": "ffffffffffff"}
    assert v(_docs(cert, email=other, certificate=other)) == "not_found"
    assert v(_docs(cert, certificate={"course": "", "institution": ""}, email={"course": "", "institution": ""})) == "manual_review"

def test_tampered_record_is_caught(client):
    cert = _setup(client)
    import app.database as db
    with db.get_connection() as conn:
        conn.execute("UPDATE certificates SET course='Hacked Course' WHERE id=?", (cert["id"],))
    d = _docs(cert, certificate={"course": "Hacked Course"}, email={"course": "Hacked Course"})
    assert client.post("/api/certificates/verify-documents", json=d).json()["status"] == "tampered"

def test_pdf_content_must_match(client):
    cert = _setup(client)
    from pypdf import PdfWriter
    w = PdfWriter(); w.add_blank_page(200, 200)
    import io; b = io.BytesIO(); w.write(b)
    r = client.post("/api/certificates/verify", data={"cert_id": cert["id"]},
                    files={"file": ("c.pdf", b.getvalue(), "application/pdf")}).json()
    assert r["verification_status"] in ("manual_review", "tampered")   # blank PDF never verifies
