import { Router } from 'express'
import db from '../db/database.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { FRAUD_FLAG_LABELS } from '../services/fraudDetection.js'

const router = Router()

router.use(requireAuth, requireRole('admin'))

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all()
  res.json({ users })
})

// GET /api/admin/certificates?risk=high
router.get('/certificates', (req, res) => {
  const { risk } = req.query
  const rows = risk
    ? db.prepare('SELECT * FROM certificates WHERE fraud_risk = ? ORDER BY created_at DESC').all(risk)
    : db.prepare('SELECT * FROM certificates ORDER BY created_at DESC').all()

  const certificates = rows.map((r) => ({
    ...r,
    fraud_flags: JSON.parse(r.fraud_flags || '[]'),
    fraud_flag_labels: JSON.parse(r.fraud_flags || '[]').map((f) => FRAUD_FLAG_LABELS[f] || f),
  }))
  res.json({ certificates })
})

// GET /api/admin/audit-logs?limit=100&type=certificate_issued
router.get('/audit-logs', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500)
  const { type } = req.query

  const logs = type
    ? db.prepare('SELECT * FROM audit_logs WHERE event_type = ? ORDER BY created_at DESC LIMIT ?').all(type, limit)
    : db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit)

  res.json({ logs })
})

// GET /api/admin/stats — powers the Verification Dashboard
router.get('/stats', (req, res) => {
  const usersByRole = db.prepare('SELECT role, COUNT(*) AS count FROM users GROUP BY role').all()
  const certsByRisk = db.prepare('SELECT fraud_risk, COUNT(*) AS count FROM certificates GROUP BY fraud_risk').all()
  const verificationsByStatus = db
    .prepare(
      `SELECT detail AS status, COUNT(*) AS count FROM audit_logs
       WHERE event_type = 'certificate_verify_attempt' GROUP BY detail`
    )
    .all()
  const totals = {
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    certificates: db.prepare('SELECT COUNT(*) AS count FROM certificates').get().count,
    verificationAttempts: db
      .prepare(`SELECT COUNT(*) AS count FROM audit_logs WHERE event_type = 'certificate_verify_attempt'`)
      .get().count,
  }

  res.json({ usersByRole, certsByRisk, verificationsByStatus, totals })
})

// GET /api/admin/reports/certificates.csv — Reports module
router.get('/reports/certificates.csv', (req, res) => {
  const rows = db.prepare('SELECT * FROM certificates ORDER BY created_at DESC').all()

  const header = [
    'id', 'student_name', 'student_email', 'course', 'institution',
    'issue_date', 'fraud_risk', 'fraud_score', 'fraud_flags', 'created_at',
  ]

  const escapeCsv = (val) => `"${String(val).replace(/"/g, '""')}"`

  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.id, r.student_name, r.student_email, r.course, r.institution,
        r.issue_date, r.fraud_risk, r.fraud_score, r.fraud_flags, r.created_at,
      ]
        .map(escapeCsv)
        .join(',')
    )
  }

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="authnode-certificates-report.csv"')
  res.send(lines.join('\n'))
})

export default router
