// Rule-based fraud/anomaly detection for certificate issuance.
//
// Honest scope note: this is NOT a trained ML model — there's no labeled
// fraud dataset to train one on. This is a deterministic rule engine that
// checks issuance patterns against the existing ledger. It's the
// legitimate, explainable version of "AI-assisted validation" for a
// prototype: every flag can be traced to a concrete reason, which matters
// more than a black-box score when someone's credential is on the line.

export const FRAUD_FLAG_LABELS = {
  duplicate_issuance: 'A certificate for this exact student and course has already been issued.',
  identity_mismatch: 'This student email was previously used with a different student name.',
  future_dated: 'The issue date is in the future.',
  bulk_issuance_pattern: 'This institution has issued an unusually high number of certificates in the last minute.',
}

const BULK_THRESHOLD = 5 // certs from one issuer within the window below
const BULK_WINDOW_SECONDS = 60

export function analyzeIssuance(db, { studentName, studentEmail, course, institution, issuerUserId, issueDate }) {
  const flags = []

  // 1. Duplicate issuance — same student + course + institution already on file
  const duplicate = db
    .prepare(
      `SELECT id FROM certificates
       WHERE student_email = ? AND course = ? AND institution = ?`
    )
    .get(studentEmail.trim().toLowerCase(), course.trim(), institution)
  if (duplicate) flags.push('duplicate_issuance')

  // 2. Identity mismatch — this email tied to a different name before
  const mismatch = db
    .prepare(
      `SELECT id FROM certificates
       WHERE student_email = ? AND student_name != ?`
    )
    .get(studentEmail.trim().toLowerCase(), studentName.trim())
  if (mismatch) flags.push('identity_mismatch')

  // 3. Future-dated certificate
  const today = new Date().toISOString().slice(0, 10)
  if (issueDate > today) flags.push('future_dated')

  // 4. Bulk issuance pattern — this issuer moving unusually fast
  const recentCount = db
    .prepare(
      `SELECT COUNT(*) AS count FROM certificates
       WHERE issued_by_user_id = ? AND created_at >= datetime('now', ?)`
    )
    .get(issuerUserId, `-${BULK_WINDOW_SECONDS} seconds`).count
  if (recentCount >= BULK_THRESHOLD) flags.push('bulk_issuance_pattern')

  const score = flags.length
  const risk = score === 0 ? 'low' : score === 1 ? 'medium' : 'high'

  return { flags, score, risk }
}
