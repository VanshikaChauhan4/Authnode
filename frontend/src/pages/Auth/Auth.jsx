import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, GraduationCap, ScanSearch, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

const ROLES = [
  { key: 'institution', label: 'Institution', icon: Building2 },
  { key: 'student', label: 'Student', icon: GraduationCap },
  { key: 'employer', label: 'Employer', icon: ScanSearch },
]

const DESTINATIONS = {
  institution: '/issue',
  student: '/dashboard',
  employer: '/verify',
}

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { login, signup } = useAuth()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [role, setRole] = useState(params.get('role') || 'student')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const roleLabel = ROLES.find((r) => r.key === role).label

  function validate() {
    if (!name.trim()) return 'Enter a name to continue.'
    if (mode === 'signup' && password.length < 8) {
      return 'Choose a password with at least 8 characters.'
    }
    if (!password) return 'Enter your password.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        await signup(name.trim(), role, password)
      } else {
        await login(name.trim(), role, password)
      }
      navigate(DESTINATIONS[role] || '/')
    } catch (err) {
      setError(err.message || 'Could not sign in — is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setPassword('')
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
            <span className="eyebrow">{mode === 'signup' ? 'Create account' : 'Sign in'}</span>
            <h2>Who are you?</h2>
            <p>Pick your role, then sign in or create an account. Every account is password-protected.</p>
          </div>

          <div className="mode-tabs">
            <button
              type="button"
              className={`mode-tab ${mode === 'signin' ? 'mode-tab-active' : ''}`}
              onClick={() => switchMode('signin')}
              disabled={loading}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === 'signup' ? 'mode-tab-active' : ''}`}
              onClick={() => switchMode('signup')}
              disabled={loading}
            >
              Create account
            </button>
          </div>

          <div className="role-tabs">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`role-tab ${role === r.key ? 'role-tab-active' : ''}`}
                onClick={() => setRole(r.key)}
                disabled={loading}
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
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                disabled={loading}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  className="auth-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              <Lock size={15} />
              {loading
                ? mode === 'signup'
                  ? 'Creating account…'
                  : 'Signing in…'
                : mode === 'signup'
                  ? `Create ${roleLabel} account`
                  : `Sign in as ${roleLabel}`}
            </button>

            <p className="auth-switch">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('signin')}>
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  New here?{' '}
                  <button type="button" onClick={() => switchMode('signup')}>
                    Create an account
                  </button>
                </>
              )}
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
