import { useState } from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { motion } from 'framer-motion'

import {
  Building2,
  GraduationCap,
  ScanSearch,
  Eye,
  EyeOff,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

import './Auth.css'


const ROLES = [
  {
    key: 'institution',
    label: 'Institution',
    icon: Building2,
  },
  {
    key: 'student',
    label: 'Student',
    icon: GraduationCap,
  },
  {
    key: 'employer',
    label: 'Employer',
    icon: ScanSearch,
  },
]


export default function Auth() {
  const [params] =
    useSearchParams()

  const navigate =
    useNavigate()

  const {
    login,
    signup,
  } = useAuth()


  const [mode, setMode] =
    useState('login')

  const [role, setRole] =
    useState(
      params.get('role') ||
      'student'
    )

  const [form, setForm] =
    useState({
      name: '',
      email: '',
      password: '',
    })

  const [showPassword, setShowPassword] =
    useState(false)

  const [error, setError] =
    useState('')

  const [submitting, setSubmitting] =
    useState(false)


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  function handleChange(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }


  // ==========================================================
  // ROLE ROUTING
  // ==========================================================

  function routeForRole(
    currentRole
  ) {
    if (
      currentRole ===
      'institution'
    ) {
      return '/issue'
    }

    if (
      currentRole ===
      'student'
    ) {
      return '/dashboard'
    }

    return '/verify'
  }


  // ==========================================================
  // LOGIN / SIGNUP
  // ==========================================================

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')


    const email =
      form.email.trim()

    const password =
      form.password

    const name =
      form.name.trim()


    if (
      !email ||
      !password
    ) {
      setError(
        'Email and password are required.'
      )

      return
    }


    if (
      mode === 'signup' &&
      !name
    ) {
      setError(
        'Enter a name to continue.'
      )

      return
    }


    setSubmitting(true)


    try {
      let data


      if (
        mode === 'signup'
      ) {
        data =
          await signup({
            name,
            email,
            password,
            role,
          })
      } else {
        data =
          await login({
            email,
            password,
          })
      }


      const authenticatedUser =
        data?.user || data


      if (
        !authenticatedUser ||
        !authenticatedUser.role
      ) {
        throw new Error(
          'Authentication succeeded, but the user account information was not returned.'
        )
      }


      navigate(
        routeForRole(
          authenticatedUser.role
        )
      )

    } catch (err) {
      setError(
        err?.message ||
        'Authentication failed. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="page auth-page guilloche-bg">

      <div className="container">

        <motion.div
          className="auth-card card"

          initial={{
            opacity: 0,
            y: 16,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.35,
          }}
        >

          {/* ==================================================
              MODE TOGGLE
          ================================================== */}

          <div className="auth-mode-toggle">

            <button
              type="button"

              className={
                mode === 'login'
                  ? 'auth-mode-active'
                  : ''
              }

              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              Sign in
            </button>


            <button
              type="button"

              className={
                mode === 'signup'
                  ? 'auth-mode-active'
                  : ''
              }

              onClick={() => {
                setMode('signup')
                setError('')
              }}
            >
              Create account
            </button>

          </div>


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="auth-card-header">

            <h2>
              {
                mode === 'login'
                  ? 'Welcome back'
                  : "Let's get you set up"
              }
            </h2>

            <p>
              {
                mode === 'login'
                  ? 'Sign in to your AuthNode account.'
                  : 'Choose your role, then create your account.'
              }
            </p>

          </div>


          {/* ==================================================
              ROLE SELECTOR
          ================================================== */}

          {mode === 'signup' && (

            <div className="role-tabs">

              {ROLES.map((r) => {

                const Icon =
                  r.icon

                return (
                  <button
                    key={r.key}

                    type="button"

                    className={
                      `role-tab ${
                        role === r.key
                          ? 'role-tab-active'
                          : ''
                      }`
                    }

                    onClick={() => {
                      setRole(r.key)
                      setError('')
                    }}
                  >

                    <Icon
                      size={18}
                      strokeWidth={1.8}
                    />

                    {r.label}

                  </button>
                )
              })}

            </div>
          )}


          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
          >

            {mode === 'signup' && (

              <div className="form-group">

                <label htmlFor="name">
                  {
                    role === 'institution'
                      ? 'Institution name'
                      : 'Your name'
                  }
                </label>


                <input
                  id="name"

                  type="text"

                  value={form.name}

                  onChange={(e) =>
                    handleChange(
                      'name',
                      e.target.value
                    )
                  }

                  placeholder={
                    role === 'institution'
                      ? 'e.g. Greenfield University'
                      : 'e.g. Priya Sharma'
                  }

                  autoFocus
                />

              </div>
            )}


            <div className="form-group">

              <label htmlFor="email">
                Email
              </label>


              <input
                id="email"

                type="email"

                value={form.email}

                onChange={(e) =>
                  handleChange(
                    'email',
                    e.target.value
                  )
                }

                placeholder="you@example.com"

                autoFocus={
                  mode === 'login'
                }

                autoComplete="email"
              />

            </div>


            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>


              <div className="password-field">

                <input
                  id="password"

                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }

                  value={form.password}

                  onChange={(e) =>
                    handleChange(
                      'password',
                      e.target.value
                    )
                  }

                  placeholder={
                    mode === 'signup'
                      ? 'At least 6 characters'
                      : '••••••••'
                  }

                  autoComplete={
                    mode === 'signup'
                      ? 'new-password'
                      : 'current-password'
                  }
                />


                <button
                  type="button"

                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }

                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {
                    showPassword
                      ? <EyeOff size={17} />
                      : <Eye size={17} />
                  }

                </button>

              </div>

            </div>


            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}


            <button
              type="submit"

              className="btn btn-primary auth-submit"

              disabled={submitting}
            >

              {
                submitting
                  ? 'Please wait…'
                  : mode === 'signup'
                    ? `Create ${role} account`
                    : 'Sign in'
              }

            </button>

          </form>

        </motion.div>

      </div>

    </div>
  )
}