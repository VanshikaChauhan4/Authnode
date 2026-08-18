import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, GraduationCap, ScanSearch, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

const ROLES = [
  { key: 'institution', label: 'Institution', icon: Building2 },
  { key: 'student', label: 'Student', icon: GraduationCap },
  { key: 'employer', label: 'Employer', icon: ScanSearch },
]

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { login, signup } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [role, setRole] = useState(params.get('role') || 'student')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function routeForRole(r) {
    if (r === 'institution') return '/issue'
    if (r === 'student') return '/dashboard'
    return '/verify'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.')
      return
    }
    if (mode === 'signup' && !form.name.trim()) {
      setError('Enter a name to continue.')
      return
    }

    setSubmitting(true)
    try {
      const user =
        mode === 'signup'
          ? await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password, role })
          : await login({ email: form.email.trim(), password: form.password })

      navigate(routeForRole(user.role))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
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
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={mode === 'login' ? 'auth-mode-active' : ''}
              onClick={() => setMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'auth-mode-active' : ''}
              onClick={() => setMode('signup')}
            >
              Create account
            </button>
          </div>

          <div className="auth-card-header">
            <h2>{mode === 'login' ? 'Welcome back' : "Let's get you set up"}</h2>
            <p>
              {mode === 'login'
                ? 'Sign in to your AuthNode account.'
                : 'Choose your role, then create your account.'}
            </p>
          </div>

          {mode === 'signup' && (
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
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name">{role === 'institution' ? 'Institution name' : 'Your name'}</label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={role === 'institution' ? 'e.g. Greenfield University' : 'e.g. Priya Sharma'}
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="you@example.com"
                autoFocus={mode === 'login'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Please wait\u2026' : mode === 'signup' ? `Create ${role} account` : 'Sign in'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
