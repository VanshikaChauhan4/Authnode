import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, Award } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getCertificatesForStudent } from '../../lib/ledger'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [certs, setCerts] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (!session || session.role !== 'student') {
      navigate('/auth?role=student')
      return
    }

    getCertificatesForStudent()
      .then(setCerts)
      .catch((err) => setError(err.message || 'Could not load certificates'))
      .finally(() => setLoading(false))
  }, [session, authLoading, navigate])

  if (authLoading) {
    return (
      <div className="page">
        <div className="container">
          <div className="card dashboard-empty">
            <p>Loading…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session || session.role !== 'student') return null

  function handleShare(id) {
    const url = `${window.location.origin}/verify/${id}`
    navigator.clipboard?.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1600)
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">{session.name}</span>
          <h1>Your credentials</h1>
          <p>Every certificate issued to you — share the QR code or link with employers.</p>
        </div>

        {loading && (
          <div className="card dashboard-empty">
            <p>Loading your certificates…</p>
          </div>
        )}

        {error && (
          <div className="card dashboard-empty">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && certs.length === 0 && (
          <div className="card dashboard-empty">
            <Award size={32} strokeWidth={1.4} />
            <p>No certificates yet. Once an institution issues one to you, it&apos;ll show up here.</p>
          </div>
        )}

        {!loading && certs.length > 0 && (
          <div className="cert-grid">
            {certs.map((c, i) => (
              <motion.div
                className="card cert-card"
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <div className="cert-card-qr">
                  <QRCodeSVG value={`${window.location.origin}/verify/${c.id}`} size={104} bgColor="transparent" fgColor="#EDEDE3" />
                </div>
                <h3>{c.course}</h3>
                <p className="cert-card-institution">{c.institution}</p>
                <p className="cert-card-date">{new Date(c.issueDate).toLocaleDateString()}</p>
                <button className="btn btn-ghost cert-share" onClick={() => handleShare(c.id)}>
                  <Share2 size={15} />
                  {copiedId === c.id ? 'Link copied' : 'Share verification link'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
