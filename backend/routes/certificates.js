import { Router } from 'express'
import crypto from 'crypto'
import db from '../db/database.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { analyzeIssuance, FRAUD_FLAG_LABELS } from '../services/fraudDetection.js'
import { logEvent } from '../services/auditLog.js'

const router = Router()

// Canonical string that gets hashed — order matters, and this exact
// shape must be reproducible during verification. This is the real
// cryptographic proof step, done server-side with Node's built-in
// crypto module (no client can influence it).
function buildCertString({ studentName, studentEmail, course, institution, issueDate }) {
  return [studentName, studentEmail, course, institution, issueDate]
    .map((s) => s.trim().toLowerCase())
    .join('|')
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

// Attaches human-readable labels and parses the stored JSON flags array
function withFraudDetails(row) {
  const flags = JSON.parse(row.fraud_flags || '[]')
  return {
    ...row,
    fraud_flags: flags,
    fraud_flag_labels: flags.map((f) => FRAUD_FLAG_LABELS[f] || f),
  }
}

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

// GET /api/certificates/issued — institutions only, their own issuance history
// (foundation for the Verification Dashboard / Admin Panel modules)
router.get('/issued', requireAuth, requireRole('institution'), (req, res) => {
  const rows = db
    .prepare('SELECT * FROM certificates WHERE issued_by_user_id = ? ORDER BY created_at DESC')
    .all(req.user.id)
  res.json({ certificates: rows.map(withFraudDetails) })
})

// GET /api/certificates/mine — students only, matched by their account email
router.get('/mine', requireAuth, requireRole('student'), (req, res) => {
  const certs = db
    .prepare('SELECT * FROM certificates WHERE student_email = ? ORDER BY created_at DESC')
    .all(req.user.email)
  res.json({ certificates: certs.map(withFraudDetails) })
})

// GET /api/certificates/verify/:id — public, no auth required.
// Anyone holding a certificate ID (e.g. from a QR code) can check it.
router.get('/verify/:id', (req, res) => {
  const entry = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id)

  if (!entry) {
    logEvent({ eventType: 'certificate_verify_attempt', actorLabel: 'anonymous verifier', targetCertId: req.params.id, detail: 'not_found' })
    return res.json({ status: 'not_found' })
  }

  const recomputed = sha256(
    buildCertString({
      studentName: entry.student_name,
      studentEmail: entry.student_email,
      course: entry.course,
      institution: entry.institution,
      issueDate: entry.issue_date,
    })
  )

  const status = recomputed === entry.hash ? 'verified' : 'tampered'

  logEvent({ eventType: 'certificate_verify_attempt', actorLabel: 'anonymous verifier', targetCertId: entry.id, detail: status })

  res.json({ status, certificate: withFraudDetails(entry) })
})

export default router
