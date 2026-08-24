"""SQLite persistence for AuthNode."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "authnode.db"


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL CHECK(
                    role IN ('institution', 'student', 'employer')
                ),
                password_hash TEXT NOT NULL DEFAULT '',
                password_salt TEXT NOT NULL DEFAULT '',
                public_key TEXT,
                private_key TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_user_identity
            ON users(lower(name), role);


            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at INTEGER NOT NULL,
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

                FOREIGN KEY (institution_id)
                REFERENCES users(id)
            );


            CREATE INDEX IF NOT EXISTS idx_cert_student
            ON certificates(lower(student_name));

            CREATE INDEX IF NOT EXISTS idx_cert_student_email
            ON certificates(lower(student_email));

            CREATE INDEX IF NOT EXISTS idx_cert_institution
            ON certificates(institution_id);
            """
        )

        migrate_legacy_schema(conn)


def migrate_legacy_schema(conn) -> None:
    """
    Safely adds new columns when an old AuthNode database already exists.
    """

    user_columns = {
        row["name"]
        for row in conn.execute(
            "PRAGMA table_info(users)"
        ).fetchall()
    }

    if "password_hash" not in user_columns:
        conn.execute(
            """
            ALTER TABLE users
            ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''
            """
        )

    if "password_salt" not in user_columns:
        conn.execute(
            """
            ALTER TABLE users
            ADD COLUMN password_salt TEXT NOT NULL DEFAULT ''
            """
        )


    certificate_columns = {
        row["name"]
        for row in conn.execute(
            "PRAGMA table_info(certificates)"
        ).fetchall()
    }

    new_columns = {
        "student_email": "TEXT NOT NULL DEFAULT ''",
        "certificate_title":
            "TEXT NOT NULL DEFAULT 'Certificate of Completion'",
        "status": "TEXT NOT NULL DEFAULT 'ACTIVE'",
        "verification_type":
            "TEXT NOT NULL DEFAULT 'BLOCKCHAIN_NATIVE'",
        "blockchain_tx_hash": "TEXT",
        "blockchain_network": "TEXT",
        "blockchain_timestamp": "TEXT",
    }

    for column_name, column_definition in new_columns.items():
        if column_name not in certificate_columns:
            conn.execute(
                f"""
                ALTER TABLE certificates
                ADD COLUMN {column_name} {column_definition}
                """
            )


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        yield conn
        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()