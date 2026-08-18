import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import './Issue.css'

const RISK_META = {
  low: { icon: CheckCircle2, label: 'No issues detected', className: 'risk-low' },
  medium: { icon: ShieldAlert, label: 'Flagged for review', className: 'risk-medium' },
  high: { icon: AlertTriangle, label: 'Multiple flags \u2014 review before sharing', className: 'risk-high' },
}

export default function Issue() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const [form, setForm] = useState({
    studentName: '',
    studentEmail: '',
    course: '',
    issueDate: new Date().toISOString().slice(0, 10),
  })
  const [stage, setStage] = useState('form') // form -> sealing -> done
  const [issued, setIssued] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'institution')) {
      navigate('/auth?role=institution')
    }
  }, [user, loading, navigate])

  if (loading || !user || user.role !== 'institution') return null

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.studentName.trim() || !form.studentEmail.trim() || !form.course.trim()) return

    setError('')
    setStage('sealing')

    try {
      // brief pause so the sealing animation is visible before the result lands
      const [entry] = await Promise.all([
        api.issueCertificate(form).then((r) => r.certificate),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
      setIssued(entry)
      setStage('done')
    } catch (err) {
      setError(err.message)
      setStage('form')
    }
  }

  function handleReset() {
    setForm({ studentName: '', studentEmail: '', course: '', issueDate: new Date().toISOString().slice(0, 10) })
    setIssued(null)
    setStage('form')
  }

  const risk = issued ? RISK_META[issued.fraud_risk] : null

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">{user.name}</span>
          <h1>Issue a certificate</h1>
          <p>Fill in the record. AuthNode generates a unique fingerprint and runs a fraud check the moment you submit it.</p>
        </div>

        <div className="issue-layout">
          <AnimatePresence mode="wait">
            {stage === 'form' && (
              <motion.form
                key="form"
                className="card issue-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="form-group">
                  <label htmlFor="studentName">Student name</label>
                  <input
                    id="studentName"
                    value={form.studentName}
                    onChange={(e) => handleChange('studentName', e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="studentEmail">Student email</label>
                  <input
                    id="studentEmail"
                    type="email"
                    value={form.studentEmail}
                    onChange={(e) => handleChange('studentEmail', e.target.value)}
                    placeholder="student@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="course">Course / credential</label>
                  <input
                    id="course"
                    value={form.course}
                    onChange={(e) => handleChange('course', e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="issueDate">Issue date</label>
                  <input
                    id="issueDate"
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => handleChange('issueDate', e.target.value)}
                    required
                  />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="btn btn-primary issue-submit">
                  Generate fingerprint & issue
                </button>
              </motion.form>
            )}

            {stage === 'sealing' && (
              <motion.div
                key="sealing"
                className="card issue-sealing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="sealing-ring"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                />
                <p>Generating fingerprint & running fraud check\u2026</p>
              </motion.div>
            )}

            {stage === 'done' && issued && (
              <motion.div
                key="done"
                className="card issue-result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <div className="issue-result-badge">
                  <CheckCircle2 size={22} />
                  Certificate secured
                </div>

                <h3>{issued.student_name}</h3>
                <p className="issue-result-course">{issued.course}</p>

                <div className="issue-result-qr">
                  <QRCodeSVG value={`${window.location.origin}/verify/${issued.id}`} size={148} bgColor="transparent" fgColor="#EDEDE3" />
                </div>

                <span className="hash-chip">{issued.hash}</span>

                <div className={`fraud-banner ${risk.className}`}>
                  <risk.icon size={17} />
                  <span>{risk.label}</span>
                </div>
                {issued.fraud_flag_labels.length > 0 && (
                  <ul className="fraud-flag-list">
                    {issued.fraud_flag_labels.map((label, i) => (
                      <li key={i}>{label}</li>
                    ))}
                  </ul>
                )}

                <div className="issue-result-actions">
                  <button className="btn btn-ghost" onClick={handleReset}>
                    Issue another
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate(`/verify/${issued.id}`)}>
                    <ShieldCheck size={16} /> Test verification
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
