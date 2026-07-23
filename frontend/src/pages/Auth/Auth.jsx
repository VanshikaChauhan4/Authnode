import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, GraduationCap, ScanSearch } from 'lucide-react'
import { login } from '../../lib/ledger'
import './Auth.css'

const ROLES = [
  { key: 'institution', label: 'Institution', icon: Building2 },
  { key: 'student', label: 'Student', icon: GraduationCap },
  { key: 'employer', label: 'Employer', icon: ScanSearch },
]

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [role, setRole] = useState(params.get('role') || 'student')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Enter a name to continue.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(name.trim(), role)

      if (role === 'institution') navigate('/issue')
      else if (role === 'student') navigate('/dashboard')
      else navigate('/verify')
    } catch (err) {
      setError(err.message || 'Could not sign in — is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page auth-page guilloche-bg">
      <div className="container">
        <motion.div
          className="auth-card card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="auth-card-header">
            <span className="eyebrow">Sign in</span>
            <h2>Who are you?</h2>
            <p>Pick your role — AuthNode will guide you from here. No password needed for this demo.</p>
          </div>

          <div className="role-tabs">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`role-tab ${role === r.key ? 'role-tab-active' : ''}`}
                onClick={() => setRole(r.key)}
              >
                <r.icon size={18} strokeWidth={1.8} />
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">
                {role === 'institution' ? 'Institution name' : 'Your name'}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'institution' ? 'e.g. Greenfield University' : 'e.g. Priya Sharma'}
                autoFocus
                disabled={loading}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : `Continue as ${ROLES.find((r) => r.key === role).label}`}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
