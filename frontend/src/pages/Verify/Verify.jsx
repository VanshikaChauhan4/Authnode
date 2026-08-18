import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldX, ShieldQuestion, ScanLine, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import './Verify.css'

export default function Verify() {
  const { id: idFromRoute } = useParams()
  const [certId, setCertId] = useState(idFromRoute || '')
  const [stage, setStage] = useState('idle') // idle -> scanning -> result
  const [result, setResult] = useState(null)

  async function runVerification(id) {
    if (!id.trim()) return
    setStage('scanning')
    setResult(null)

    const [outcome] = await Promise.all([
      api.verifyCertificate(id.trim()),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ])
    setResult(outcome)
    setStage('result')
  }

  useEffect(() => {
    if (idFromRoute) runVerification(idFromRoute)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFromRoute])

  function handleSubmit(e) {
    e.preventDefault()
    runVerification(certId)
  }

  function reset() {
    setStage('idle')
    setResult(null)
    setCertId('')
  }

  const cert = result?.certificate
  const showCaution = result?.status === 'verified' && cert?.fraud_risk && cert.fraud_risk !== 'low'

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Verify</span>
          <h1>Check a certificate</h1>
          <p>Paste the certificate ID from a QR code, or scan it directly on a phone.</p>
        </div>

        <div className="verify-layout">
          <AnimatePresence mode="wait">
            {stage === 'idle' && (
              <motion.form
                key="idle"
                className="card verify-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="form-group">
                  <label htmlFor="certId">Certificate ID</label>
                  <input
                    id="certId"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    placeholder="e.g. 9f3a21b4c8d0"
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary verify-submit">
                  <ScanLine size={17} /> Verify certificate
                </button>
              </motion.form>
            )}

            {stage === 'scanning' && (
              <motion.div
                key="scanning"
                className="card verify-scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="scan-line"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                />
                <ShieldQuestion size={44} strokeWidth={1.3} />
                <p>Checking authenticity\u2026</p>
              </motion.div>
            )}

            {stage === 'result' && result && (
              <motion.div
                key="result"
                className={`card verify-result verify-result-${result.status}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {result.status === 'verified' && (
                  <>
                    <ShieldCheck size={56} strokeWidth={1.4} />
                    <h2>Verified</h2>
                    <p className="verify-result-sub">
                      Issued by <strong>{cert.institution}</strong> on{' '}
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </p>
                    <div className="verify-result-details">
                      <span>{cert.student_name}</span>
                      <span>{cert.course}</span>
                    </div>

                    {showCaution && (
                      <div className="verify-caution">
                        <AlertTriangle size={15} />
                        <span>
                          This certificate matches its record, but was flagged during issuance:{' '}
                          {cert.fraud_flag_labels.join(' ')}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {result.status === 'tampered' && (
                  <>
                    <ShieldX size={56} strokeWidth={1.4} />
                    <h2>Does not match</h2>
                    <p className="verify-result-sub">
                      This certificate's record has changed since it was issued. Treat it as unverified.
                    </p>
                  </>
                )}

                {result.status === 'not_found' && (
                  <>
                    <ShieldQuestion size={56} strokeWidth={1.4} />
                    <h2>Not found</h2>
                    <p className="verify-result-sub">
                      No certificate matches this ID. Double-check it or ask the holder to re-share their QR code.
                    </p>
                  </>
                )}

                <button className="btn btn-ghost verify-again" onClick={reset}>
                  Verify another
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
