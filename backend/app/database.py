
"""SQLite persistence for AuthNode."""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import unquote


# ---------------------------------------------------------
# DATABASE CONFIGURATION
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

_DEFAULT_DB_PATH = BASE_DIR / "authnode.db"
_DATABASE_URL = os.getenv("DATABASE_URL", "").strip()


def get_database_path() -> Path:
    """Resolve the SQLite database path."""

    if not _DATABASE_URL.startswith("sqlite:///"):
        return _DEFAULT_DB_PATH

    raw_path = unquote(_DATABASE_URL[len("sqlite:///"):])

    if not raw_path:
        return _DEFAULT_DB_PATH

    db_path = Path(raw_path)

    if db_path.is_absolute():
        return db_path

    return BASE_DIR / db_path


DB_PATH = get_database_path()


# ---------------------------------------------------------
# DATABASE CONNECTION
# ---------------------------------------------------------

@contextmanager
def get_connection():
    """Create and safely manage a SQLite connection."""

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(
        str(DB_PATH),
        timeout=15,
    )

    conn.row_factory = sqlite3.Row

    try:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA busy_timeout = 15000")

        yield conn

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ---------------------------------------------------------
# DATABASE INITIALIZATION
# ---------------------------------------------------------

def init_db() -> None:
    """Create database tables and initialize indexes."""

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with get_connection() as conn:

        conn.execute("PRAGMA journal_mode = WAL")

        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                role TEXT NOT NULL CHECK (
                    role IN ('institution', 'student', 'employer')
                ),
                password_hash TEXT NOT NULL DEFAULT '',
                password_salt TEXT NOT NULL DEFAULT '',
                public_key TEXT,
                private_key TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                certificate_id TEXT,
                status TEXT NOT NULL,
                reason TEXT,
                message TEXT,
                checks_json TEXT,
                extracted_json TEXT,
                fingerprint TEXT,
                attempts INTEGER NOT NULL DEFAULT 1,
                verified_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS certificates (
                id TEXT PRIMARY KEY,
                hash TEXT NOT NULL UNIQUE,
                signature TEXT NOT NULL,
                student_name TEXT NOT NULL,
                student_email TEXT NOT NULL,
                course TEXT NOT NULL,
                certificate_title TEXT NOT NULL,
                institution TEXT NOT NULL,
                institution_id TEXT NOT NULL,
                issue_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                verification_type TEXT NOT NULL
                    DEFAULT 'BLOCKCHAIN_NATIVE',
                blockchain_tx_hash TEXT,
                blockchain_network TEXT,
                blockchain_timestamp TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (institution_id) REFERENCES users(id)
            );
            """
        )

        # Migrate older database structures.
        migrate_legacy_schema(conn)

        # Records without a blockchain transaction hash are
        # local cryptographic records, not blockchain registrations.
        conn.execute(
            """
            UPDATE certificates
            SET verification_type = 'LOCAL_CRYPTOGRAPHIC'
            WHERE blockchain_tx_hash IS NULL
              AND verification_type = 'BLOCKCHAIN_NATIVE'
            """
        )

        # -------------------------------------------------
        # INDEXES
        # -------------------------------------------------

        conn.executescript(
            """
            DROP INDEX IF EXISTS idx_user_identity;

            CREATE INDEX IF NOT EXISTS idx_user_name
            ON users(lower(name), role);

            CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_role
            ON users(lower(email), role)
            WHERE email IS NOT NULL AND trim(email) <> '';

            CREATE INDEX IF NOT EXISTS idx_sessions_user
            ON sessions(user_id);

            CREATE INDEX IF NOT EXISTS idx_verif_user
            ON verifications(user_id, verified_at);

            CREATE UNIQUE INDEX IF NOT EXISTS idx_verif_user_cert_ok
            ON verifications(user_id, certificate_id)
            WHERE status = 'verified'
              AND certificate_id IS NOT NULL;

            CREATE INDEX IF NOT EXISTS idx_cert_student
            ON certificates(lower(student_name));

            CREATE INDEX IF NOT EXISTS idx_cert_student_email
            ON certificates(lower(student_email));

            CREATE INDEX IF NOT EXISTS idx_cert_institution
            ON certificates(institution_id);
            """
        )


# ---------------------------------------------------------
# LEGACY DATABASE MIGRATION
# ---------------------------------------------------------

def migrate_legacy_schema(conn: sqlite3.Connection) -> None:
    """Add missing columns to existing AuthNode databases."""

    # -----------------------------------------------------
    # USERS TABLE
    # -----------------------------------------------------

    user_columns = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(users)").fetchall()
    }

    user_migrations = {
        "email": "TEXT",
        "password_hash": "TEXT NOT NULL DEFAULT ''",
        "password_salt": "TEXT NOT NULL DEFAULT ''",
        "public_key": "TEXT",
        "private_key": "TEXT",
    }

    for column_name, definition in user_migrations.items():

        if column_name not in user_columns:
            conn.execute(
                f"ALTER TABLE users ADD COLUMN {column_name} {definition}"
            )

    # -----------------------------------------------------
    # CERTIFICATES TABLE
    # -----------------------------------------------------

    certificate_columns = {
        row["name"]
        for row in conn.execute(
            "PRAGMA table_info(certificates)"
        ).fetchall()
    }

    certificate_migrations = {
        "student_email": "TEXT NOT NULL DEFAULT ''",
        "certificate_title": (
            "TEXT NOT NULL DEFAULT 'Certificate of Completion'"
        ),
        "status": "TEXT NOT NULL DEFAULT 'ACTIVE'",
        "verification_type": (
            "TEXT NOT NULL DEFAULT 'BLOCKCHAIN_NATIVE'"
        ),
        "blockchain_tx_hash": "TEXT",
        "blockchain_network": "TEXT",
        "blockchain_timestamp": "TEXT",
    }

    for column_name, definition in certificate_migrations.items():

        if column_name not in certificate_columns:
            conn.execute(
                f"ALTER TABLE certificates "
                f"ADD COLUMN {column_name} {definition}"
            )


# ---------------------------------------------------------
# DATABASE HEALTH CHECK
# ---------------------------------------------------------

def check_database() -> bool:
    """Return True if the database can be accessed."""

    try:
        with get_connection() as conn:
            conn.execute("SELECT 1")
        return True

    except sqlite3.Error:
        return False
