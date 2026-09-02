import { Router } from 'express'
import crypto from 'crypto'
import db from '../db/database.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { analyzeIssuance, FRAUD_FLAG_LABELS } from '../services/fraudDetection.js'
import { logEvent } from '../services/auditLog.js'

const router = Router()

/* ============================================================
   CRYPTO & HASH HELPERS
============================================================ */

// Canonical string that gets hashed — order matters, and this exact
// shape must be reproducible during verification.
function buildCertString({ studentName, studentEmail, course, institution, issueDate }) {
  return [studentName, studentEmail, course, institution, issueDate]
    .map((s) => (s ? s.trim().toLowerCase() : ''))
    .join('|')
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

// Attaches human-readable labels and parses the stored JSON flags array
function withFraudDetails(row) {
  if (!row) return null
  const flags = JSON.parse(row.fraud_flags || '[]')
  return {
    ...row,
    fraud_flags: flags,
    fraud_flag_labels: flags.map((f) => FRAUD_FLAG_LABELS[f] || f),
  }
}

// Robust fuzzy comparison for names (tolerates case, punctuation, middle names)
function namesMatch(nameA = '', nameB = '') {
  const cleanA = nameA.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
  const cleanB = nameB.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

  if (!cleanA || !cleanB) return true // Don't block if one side wasn't provided
  if (cleanA === cleanB) return true
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true

  const partsA = cleanA.split(' ').filter(Boolean)
  const partsB = cleanB.split(' ').filter(Boolean)
  const commonWords = partsA.filter((part) => partsB.includes(part))

  return commonWords.length >= Math.min(partsA.length, partsB.length) * 0.6
}

/* ============================================================
   ROUTES
============================================================ */

// POST /api/certificates/issue — institutions only
router.post('/issue', requireAuth, requireRole('institution'), (req, res) => {
  const { studentName, studentEmail, course, issueDate } = req.body

  if (!studentName?.trim() || !studentEmail?.trim() || !course?.trim() || !issueDate) {
    return res.status(400).json({ error: 'Student name, student email, course, and issue date are all required.' })
  }

  const institution = req.user.name
  const certString = buildCertString({ studentName, studentEmail, course, institution, issueDate })
  const hash = sha256(certString)
  const id = hash.slice(0, 12)

  const analysis = analyzeIssuance(db, {
    studentName,
    studentEmail,
    course,
    institution,
    issuerUserId: req.user.id,
    issueDate,
  })

  db.prepare(
    `INSERT INTO certificates
       (id, hash, student_name, student_email, course, institution, issue_date, issued_by_user_id, fraud_score, fraud_risk, fraud_flags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    hash,
    studentName.trim(),
    studentEmail.trim().toLowerCase(),
    course.trim(),
    institution,
    issueDate,
    req.user.id,
    analysis.score,
    analysis.risk,
    JSON.stringify(analysis.flags)
  )

  const entry = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id)

  logEvent({
    eventType: 'certificate_issued',
    actorLabel: `${req.user.email} (institution)`,
    targetCertId: id,
    detail: analysis.risk !== 'low' ? `flagged: ${analysis.flags.join(', ')}` : null,
  })

  res.status(201).json({ certificate: withFraudDetails(entry) })
})

// GET /api/certificates/issued — institutions only
router.get('/issued', requireAuth, requireRole('institution'), (req, res) => {
  const rows = db
    .prepare('SELECT * FROM certificates WHERE issued_by_user_id = ? ORDER BY created_at DESC')
    .all(req.user.id)
  res.json({ certificates: rows.map(withFraudDetails) })
})

// GET /api/certificates/mine — students only
router.get('/mine', requireAuth, requireRole('student'), (req, res) => {
  const certs = db
    .prepare('SELECT * FROM certificates WHERE student_email = ? ORDER BY created_at DESC')
    .all(req.user.email)
  res.json({ certificates: certs.map(withFraudDetails) })
})

/* ============================================================
   CORE VERIFICATION ROUTE
   GET /api/certificates/verify/:id?studentName=...
============================================================ */
router.get('/verify/:id', (req, res) => {
  try {
    const rawId = (req.params.id || '').trim()
    const queryStudentName = (req.query.studentName || '').trim()

    if (!rawId) {
      return res.status(400).json({ status: 'invalid', message: 'Certificate ID is required.' })
    }

    // 1. Case-insensitive lookup in SQLite Database
    const entry = db
      .prepare('SELECT * FROM certificates WHERE id = ? OR LOWER(id) = LOWER(?)')
      .get(rawId, rawId)

    if (!entry) {
      logEvent({
        eventType: 'certificate_verify_attempt',
        actorLabel: 'anonymous verifier',
        targetCertId: rawId,
        detail: 'not_found',
      })
      return res.json({
        status: 'not_found',
        message: `Certificate ID "${rawId}" was not found in the database.`,
      })
    }

    // 2. SHA-256 Hash Cryptographic Verification
    const recomputed = sha256(
      buildCertString({
        studentName: entry.student_name,
        studentEmail: entry.student_email,
        course: entry.course,
        institution: entry.institution,
        issueDate: entry.issue_date,
      })
    )

    if (recomputed !== entry.hash) {
      logEvent({
        eventType: 'certificate_verify_attempt',
        actorLabel: 'anonymous verifier',
        targetCertId: entry.id,
        detail: 'tampered',
      })
      return res.json({
        status: 'tampered',
        message: 'Cryptographic hash mismatch. Certificate data appears to have been modified or tampered with.',
        certificate: withFraudDetails(entry),
      })
    }

    // 3. Student Name Verification (if provided)
    if (queryStudentName && !namesMatch(queryStudentName, entry.student_name)) {
      logEvent({
        eventType: 'certificate_verify_attempt',
        actorLabel: 'anonymous verifier',
        targetCertId: entry.id,
        detail: 'name_mismatch',
      })
      return res.json({
        status: 'name_mismatch',
        message: `Student name does not match the certificate record.`,
        registeredName: entry.student_name,
        providedName: queryStudentName,
        certificate: withFraudDetails(entry),
      })
    }

    // 4. Verification Successful
    logEvent({
      eventType: 'certificate_verify_attempt',
      actorLabel: 'anonymous verifier',
      targetCertId: entry.id,
      detail: 'verified',
    })

    return res.json({
      status: 'verified',
      message: 'Certificate successfully verified via database lookup and SHA-256 proof.',
      certificate: withFraudDetails(entry),
      verification: {
        hashVerified: true,
        hash: entry.hash,
        verifiedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('Verification error:', err)
    return res.status(500).json({ status: 'error', message: 'Internal verification error.' })
  }
})

// Optional POST /api/certificates/verify support
router.post('/verify', (req, res) => {
  const { id, studentName } = req.body
  req.params.id = id
  req.query.studentName = studentName
  return router.handle(req, res)
})

export default router