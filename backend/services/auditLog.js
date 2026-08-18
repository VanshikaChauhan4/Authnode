import db from '../db/database.js'

const insert = db.prepare(
  `INSERT INTO audit_logs (event_type, actor_label, target_cert_id, detail)
   VALUES (?, ?, ?, ?)`
)

// Fire-and-forget style logger used across routes. Never throws \u2014
// a logging failure should never break the actual request.
export function logEvent({ eventType, actorLabel, targetCertId = null, detail = null }) {
  try {
    insert.run(eventType, actorLabel, targetCertId, detail)
  } catch (err) {
    console.error('audit log failed:', err.message)
  }
}
