import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'authnode.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ---------- Schema ----------
// Real SQL tables, not localStorage. This is the single source of truth
// for users and certificates. Two tables, one relationship: a certificate
// is issued by an institution (users.id) and looked up for a student by
// matching student_email against a logged-in student's own email.

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('institution', 'student', 'employer', 'admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    hash TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    course TEXT NOT NULL,
    institution TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    issued_by_user_id INTEGER NOT NULL REFERENCES users(id),
    fraud_score INTEGER NOT NULL DEFAULT 0,
    fraud_risk TEXT NOT NULL DEFAULT 'low',
    fraud_flags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_certificates_student_email
    ON certificates(student_email);

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    actor_label TEXT NOT NULL,
    target_cert_id TEXT,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs(created_at DESC);
`)

export default db
