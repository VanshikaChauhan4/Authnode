import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { getSession, issueCertificate } from '../../lib/ledger'
import './Issue.css'

export default function Issue() {
  const navigate = useNavigate()
  const session = getSession()

  const [form, setForm] = useState({
    studentName: '',
    course: '',
    issueDate: new Date().toISOString().slice(0, 10),
  })
  const [stage, setStage] = useState('form')
  const [issued, setIssued] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session || session.role !== 'institution') {
      navigate('/auth?role=institution')
    }
  }, [session, navigate])

  if (!session || session.role !== 'institution') return null

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.studentName.trim() || !form.course.trim()) return

    setError('')
    setStage('sealing')

    try {
      await new Promise((r) => setTimeout(r, 900))
      const entry = await issueCertificate({
        studentName: form.studentName,
        course: form.course,
        institution: session.name,
        issueDate: form.issueDate,
      })
      setIssued(entry)
      setStage('done')
    } catch (err) {
      setError(err.message || 'Could not issue certificate')
      setStage('form')
    }
  }

  function handleReset() {
    setForm({ studentName: '', course: '', issueDate: new Date().toISOString().slice(0, 10) })
    setIssued(null)
    setStage('form')
    setError('')
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">{session.name}</span>
          <h1>Issue a certificate</h1>
          <p>Fill in the record. AuthNode secures it the moment you submit — saved permanently, can't be edited.</p>
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

                {error && <p className="issue-error">{error}</p>}

                <button type="submit" className="btn btn-primary issue-submit">
                  Issue certificate
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
                <p>Securing certificate…</p>
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

                <p className="issue-result-saved">Saved permanently — can&apos;t be edited</p>

                <h3>{issued.studentName}</h3>
                <p className="issue-result-course">{issued.course}</p>

                <div className="issue-result-qr">
                  <QRCodeSVG value={`${window.location.origin}/verify/${issued.id}`} size={148} bgColor="transparent" fgColor="#EDEDE3" />
                </div>

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
