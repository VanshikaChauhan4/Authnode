import { Router } from 'express'
import crypto from 'crypto'

import db from '../db/database.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  analyzeIssuance,
  FRAUD_FLAG_LABELS,
} from '../services/fraudDetection.js'
import { logEvent } from '../services/auditLog.js'

const router = Router()

/* ============================================================
   CRYPTO & HASH HELPERS
============================================================ */

/*
 * IMPORTANT:
 *
 * This canonical format MUST remain exactly the same for both
 * certificate issuance and certificate verification.
 *
 * If this format changes after certificates have already been
 * issued, previously generated hashes will no longer match.
 */
function buildCertString({
  studentName,
  studentEmail,
  course,
  institution,
  issueDate,
}) {
  return [
    studentName,
    studentEmail,
    course,
    institution,
    issueDate,
  ]
    .map((value) =>
      value === undefined ||
      value === null
        ? ''
        : String(value).trim().toLowerCase()
    )
    .join('|')
}

/*
 * Server-side SHA-256.
 *
 * The frontend NEVER generates the authoritative certificate hash.
 */
function sha256(input) {
  return crypto
    .createHash('sha256')
    .update(String(input), 'utf8')
    .digest('hex')
}

/*
 * Timing-safe comparison for hash strings.
 *
 * Both hashes should normally be 64 hexadecimal characters.
 */
function hashesMatch(hashA, hashB) {
  if (
    typeof hashA !== 'string' ||
    typeof hashB !== 'string'
  ) {
    return false
  }

  if (
    hashA.length !== hashB.length ||
    hashA.length === 0
  ) {
    return false
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hashA, 'utf8'),
      Buffer.from(hashB, 'utf8')
    )
  } catch {
    return false
  }
}

/*
 * Safely parses fraud flags.
 */
function parseFraudFlags(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  try {
    const parsed = JSON.parse(value)

    return Array.isArray(parsed)
      ? parsed
      : []
  } catch {
    return []
  }
}

/*
 * Adds human-readable fraud labels.
 */
function withFraudDetails(row) {
  if (!row) {
    return null
  }

  const flags = parseFraudFlags(
    row.fraud_flags
  )

  return {
    ...row,

    fraud_flags: flags,

    fraud_flag_labels: flags.map(
      (flag) =>
        FRAUD_FLAG_LABELS[flag] || flag
    ),
  }
}

/*
 * Public verification response.
 *
 * The database remains the source of truth, but avoid exposing
 * unnecessary internal information to anonymous verifiers.
 *
 * The cryptographic hash itself is retained because it is part of
 * the certificate proof/record shown by AuthNode.
 */
function publicCertificateRecord(row) {
  if (!row) {
    return null
  }

  const certificate = withFraudDetails(row)

  return {
    id: certificate.id,

    student_name:
      certificate.student_name,

    course:
      certificate.course,

    institution:
      certificate.institution,

    issue_date:
      certificate.issue_date,

    hash:
      certificate.hash,

    fraud_score:
      certificate.fraud_score,

    fraud_risk:
      certificate.fraud_risk,

    fraud_flags:
      certificate.fraud_flags,

    fraud_flag_labels:
      certificate.fraud_flag_labels,

    /*
     * Keep optional fields if the current database contains them.
     */
    ...(certificate.certificate_title
      ? {
          certificate_title:
            certificate.certificate_title,
        }
      : {}),

    ...(certificate.institution_id
      ? {
          institution_id:
            certificate.institution_id,
        }
      : {}),
  }
}

/* ============================================================
   POST /api/certificates/issue
   Institutions only
============================================================ */

router.post(
  '/issue',
  requireAuth,
  requireRole('institution'),
  (req, res) => {
    try {
      const {
        studentName,
        studentEmail,
        course,
        issueDate,
      } = req.body

      /*
       * Validate required fields.
       */
      if (
        !studentName?.trim() ||
        !studentEmail?.trim() ||
        !course?.trim() ||
        !issueDate
      ) {
        return res.status(400).json({
          error:
            'Student name, student email, course, and issue date are all required.',
        })
      }

      /*
       * The issuer/institution comes from the authenticated
       * backend user — NOT from the frontend request body.
       */
      const institution = String(
        req.user.name || ''
      ).trim()

      if (!institution) {
        return res.status(400).json({
          error:
            'The authenticated institution does not have a valid name.',
        })
      }

      /*
       * Normalize the values ONCE before hashing.
       *
       * The exact same canonical representation is later used
       * during verification.
       */
      const normalizedStudentName =
        studentName.trim()

      const normalizedStudentEmail =
        studentEmail.trim().toLowerCase()

      const normalizedCourse =
        course.trim()

      const normalizedIssueDate =
        String(issueDate).trim()

      /*
       * Build canonical certificate string.
       */
      const certString = buildCertString({
        studentName:
          normalizedStudentName,

        studentEmail:
          normalizedStudentEmail,

        course:
          normalizedCourse,

        institution,

        issueDate:
          normalizedIssueDate,
      })

      /*
       * Generate authoritative SHA-256 hash.
       */
      const hash = sha256(certString)

      /*
       * Certificate ID is derived from the authoritative hash.
       */
      const id = hash.slice(0, 12)

      /*
       * Fraud analysis remains part of the existing system.
       */
      const analysis = analyzeIssuance(
        db,
        {
          studentName:
            normalizedStudentName,

          studentEmail:
            normalizedStudentEmail,

          course:
            normalizedCourse,

          institution,

          issuerUserId:
            req.user.id,

          issueDate:
            normalizedIssueDate,
        }
      )

      /*
       * Protect against accidental duplicate IDs.
       */
      const existing = db
        .prepare(
          'SELECT id FROM certificates WHERE id = ?'
        )
        .get(id)

      if (existing) {
        return res.status(409).json({
          error:
            'A certificate with this generated ID already exists.',
          certificateId: id,
        })
      }

      /*
       * Persist certificate in SQLite.
       *
       * This is the permanent source of truth.
       */
      db.prepare(
        `INSERT INTO certificates
          (
            id,
            hash,
            student_name,
            student_email,
            course,
            institution,
            issue_date,
            issued_by_user_id,
            fraud_score,
            fraud_risk,
            fraud_flags
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        hash,
        normalizedStudentName,
        normalizedStudentEmail,
        normalizedCourse,
        institution,
        normalizedIssueDate,
        req.user.id,
        analysis.score,
        analysis.risk,
        JSON.stringify(
          analysis.flags || []
        )
      )

      /*
       * Read the actual persisted record back from SQLite.
       */
      const entry = db
        .prepare(
          'SELECT * FROM certificates WHERE id = ?'
        )
        .get(id)

      /*
       * Audit certificate issuance.
       */
      logEvent({
        eventType:
          'certificate_issued',

        actorLabel:
          `${req.user.email} (institution)`,

        targetCertId:
          id,

        detail:
          analysis.risk !== 'low'
            ? `flagged: ${(analysis.flags || []).join(', ')}`
            : null,
      })

      return res.status(201).json({
        certificate:
          withFraudDetails(entry),
      })
    } catch (err) {
      console.error(
        'Certificate issuance error:',
        err
      )

      return res.status(500).json({
        error:
          'Unable to issue certificate.',
      })
    }
  }
)

/* ============================================================
   GET /api/certificates/issued
   Institutions only
============================================================ */

router.get(
  '/issued',
  requireAuth,
  requireRole('institution'),
  (req, res) => {
    try {
      const rows = db
        .prepare(
          `SELECT *
           FROM certificates
           WHERE issued_by_user_id = ?
           ORDER BY created_at DESC`
        )
        .all(req.user.id)

      return res.json({
        certificates:
          rows.map(withFraudDetails),
      })
    } catch (err) {
      console.error(
        'Certificate history error:',
        err
      )

      return res.status(500).json({
        error:
          'Unable to load issued certificates.',
      })
    }
  }
)

/* ============================================================
   GET /api/certificates/mine
   Students only
============================================================ */

router.get(
  '/mine',
  requireAuth,
  requireRole('student'),
  (req, res) => {
    try {
      const certs = db
        .prepare(
          `SELECT *
           FROM certificates
           WHERE student_email = ?
           ORDER BY created_at DESC`
        )
        .all(req.user.email)

      return res.json({
        certificates:
          certs.map(withFraudDetails),
      })
    } catch (err) {
      console.error(
        'Student certificate lookup error:',
        err
      )

      return res.status(500).json({
        error:
          'Unable to load your certificates.',
      })
    }
  }
)

/* ============================================================
   GET /api/certificates/verify/:id

   PUBLIC AUTHORITATIVE VERIFICATION

   No authentication is required.

   The backend:
   1. Receives certificate ID.
   2. Finds certificate in SQLite.
   3. Rebuilds canonical certificate string.
   4. Recalculates SHA-256.
   5. Compares recalculated hash with stored hash.
   6. Returns verified / tampered / not_found.

   The frontend cannot override this result.
============================================================ */

router.get(
  '/verify/:id',
  (req, res) => {
    try {
      /*
       * Certificate IDs generated by AuthNode contain only
       * hexadecimal characters because they are derived from
       * SHA-256.
       *
       * Keep the validation slightly broader for compatibility
       * with existing records.
       */
      const rawId = String(
        req.params.id || ''
      ).trim()

      if (!rawId) {
        return res.status(400).json({
          status: 'not_found',
          certificate: null,
          message:
            'Certificate ID is required.',
        })
      }

      /*
       * Protect the lookup from unexpectedly large input.
       */
      if (rawId.length > 128) {
        return res.status(400).json({
          status: 'not_found',
          certificate: null,
          message:
            'Invalid Certificate ID.',
        })
      }

      /*
       * ========================================================
       * DATABASE LOOKUP
       * ========================================================
       *
       * Case-insensitive matching allows:
       *
       * abc123
       *
       * and
       *
       * ABC123
       *
       * to locate the same record.
       *
       * The actual database record remains authoritative.
       */
      const entry = db
        .prepare(
          `SELECT *
           FROM certificates
           WHERE id = ?
              OR LOWER(id) = LOWER(?)
           LIMIT 1`
        )
        .get(
          rawId,
          rawId
        )

      /*
       * ========================================================
       * CERTIFICATE DOES NOT EXIST
       * ========================================================
       */
      if (!entry) {
        logEvent({
          eventType:
            'certificate_verify_attempt',

          actorLabel:
            'anonymous verifier',

          targetCertId:
            rawId,

          detail:
            'not_found',
        })

        return res.json({
          status:
            'not_found',

          certificate:
            null,

          message:
            'No certificate with this Certificate ID exists in the AuthNode verification database.',
        })
      }

      /*
       * ========================================================
       * VALIDATE STORED DATABASE FIELDS
       * ========================================================
       *
       * A cryptographic verification should fail safely if
       * required certificate fields are missing.
       */
      const requiredFields = [
        entry.student_name,
        entry.student_email,
        entry.course,
        entry.institution,
        entry.issue_date,
        entry.hash,
      ]

      const hasMissingField =
        requiredFields.some(
          (value) =>
            value === undefined ||
            value === null ||
            String(value).trim() === ''
        )

      if (hasMissingField) {
        logEvent({
          eventType:
            'certificate_verify_attempt',

          actorLabel:
            'anonymous verifier',

          targetCertId:
            entry.id,

          detail:
            'invalid_record',
        })

        return res.json({
          status:
            'tampered',

          certificate:
            publicCertificateRecord(entry),

          message:
            'The certificate record is incomplete and its cryptographic integrity cannot be established.',
        })
      }

      /*
       * ========================================================
       * REBUILD CANONICAL CERTIFICATE STRING
       * ========================================================
       *
       * CRITICAL:
       *
       * These values come from SQLite.
       *
       * They do NOT come from:
       *
       * - React
       * - OCR
       * - localStorage
       * - user input
       * - URL query values
       */
      const canonicalCertificateString =
        buildCertString({
          studentName:
            entry.student_name,

          studentEmail:
            entry.student_email,

          course:
            entry.course,

          institution:
            entry.institution,

          issueDate:
            entry.issue_date,
        })

      /*
       * ========================================================
       * RECALCULATE SHA-256
       * ========================================================
       */
      const recomputedHash =
        sha256(
          canonicalCertificateString
        )

      /*
       * ========================================================
       * CRYPTOGRAPHIC COMPARISON
       * ========================================================
       */
      const cryptographicMatch =
        hashesMatch(
          recomputedHash,
          String(entry.hash).trim().toLowerCase()
        )

      /*
       * ========================================================
       * TAMPERED
       * ========================================================
       */
      if (!cryptographicMatch) {
        logEvent({
          eventType:
            'certificate_verify_attempt',

          actorLabel:
            'anonymous verifier',

          targetCertId:
            entry.id,

          detail:
            'tampered',
        })

        return res.json({
          status:
            'tampered',

          certificate:
            publicCertificateRecord(entry),

          message:
            'The certificate was found in the AuthNode database, but its cryptographic integrity check failed.',
        })
      }

      /*
       * ========================================================
       * VERIFIED
       * ========================================================
       *
       * At this point:
       *
       * Certificate exists.
       * Required fields exist.
       * Canonical data reconstructed.
       * SHA-256 recalculated.
       * Stored hash matches recalculated hash.
       *
       * ONLY NOW can the backend return "verified".
       */
      logEvent({
        eventType:
          'certificate_verify_attempt',

        actorLabel:
          'anonymous verifier',

        targetCertId:
          entry.id,

        detail:
          'verified',
      })

      return res.json({
        status:
          'verified',

        certificate:
          publicCertificateRecord(entry),

        verification: {
          certificateExists:
            true,

          cryptographicIntegrity:
            true,

          hashAlgorithm:
            'SHA-256',

          certificateId:
            entry.id,
        },

        message:
          'Certificate found and cryptographic integrity verified successfully.',
      })
    } catch (err) {
      console.error(
        'Certificate verification error:',
        err
      )

      /*
       * NEVER return "verified" from an exception.
       */
      return res.status(500).json({
        status:
          'error',

        certificate:
          null,

        message:
          'Internal verification server error. The certificate could not be verified.',
      })
    }
  }
)

export default router