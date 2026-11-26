<<<<<<< HEAD

=======
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
import { useState } from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { motion } from 'framer-motion'

import { Building2, Eye, EyeOff } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

import './Auth.css'

<<<<<<< HEAD
const ROLES = [
  {
    key: 'institution',
    label: 'Teacher',
    icon: Building2,
  },
]

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const { login, signup } = useAuth()

  const [mode, setMode] = useState('login')

  const [role, setRole] = useState('institution')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field, value) {
=======

const ROLES = [{ key: 'institution', label: 'Teacher', icon: Building2 }]


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
      'institution'
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
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

<<<<<<< HEAD
  function routeForRole(currentRole) {
    if (currentRole === 'institution') {
      return '/verify'
    }

    if (currentRole === 'student') {
=======

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
      return '/verify'
    }

    if (
      currentRole ===
      'student'
    ) {
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
      return '/dashboard'
    }

    return '/verify'
  }

<<<<<<< HEAD
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const email = form.email.trim().toLowerCase()
    const password = form.password
    const name = form.name.trim()

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    if (mode === 'signup' && !name) {
      setError('Enter a name to continue.')
      return
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setSubmitting(true)

    try {
      let data

      if (mode === 'signup') {
        data = await signup({
          name,
          email,
          password,
          role,
        })
      } else {
        // IMPORTANT:
        // Backend LoginRequest requires role.
        // Previously frontend sent only email and password.
        data = await login({
          email,
          password,
          role,
        })
      }

      const authenticatedUser = data?.user || data

      if (!authenticatedUser || !authenticatedUser.role) {
        throw new Error(
          'Authentication succeeded, but user information was not returned.'
        )
      }

      navigate(routeForRole(authenticatedUser.role))
    } catch (err) {
      setError(
        err?.message ||
        'Authentication failed. Please check your credentials and try again.'
=======

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
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
      )
    } finally {
      setSubmitting(false)
    }
  }

<<<<<<< HEAD
  return (
    <div className="page auth-page guilloche-bg">
      <div className="container">
        <motion.div
          className="auth-card card"
=======

  return (
    <div className="page auth-page guilloche-bg">

      <div className="container">

        <motion.div
          className="auth-card card"

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
          initial={{
            opacity: 0,
            y: 16,
          }}
<<<<<<< HEAD
=======

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
          animate={{
            opacity: 1,
            y: 0,
          }}
<<<<<<< HEAD
=======

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
          transition={{
            duration: 0.35,
          }}
        >
<<<<<<< HEAD
          {/* MODE TOGGLE */}

          <div className="auth-mode-toggle">
            <button
              type="button"
=======

          {/* ==================================================
              MODE TOGGLE
          ================================================== */}

          <div className="auth-mode-toggle">

            <button
              type="button"

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
              className={
                mode === 'login'
                  ? 'auth-mode-active'
                  : ''
              }
<<<<<<< HEAD
=======

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              Sign in
            </button>

<<<<<<< HEAD
            <button
              type="button"
=======

            <button
              type="button"

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
              className={
                mode === 'signup'
                  ? 'auth-mode-active'
                  : ''
              }
<<<<<<< HEAD
=======

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
              onClick={() => {
                setMode('signup')
                setError('')
              }}
            >
              Create account
            </button>
<<<<<<< HEAD
          </div>

          {/* HEADER */}

          <div className="auth-card-header">
            <h2>
              {mode === 'login'
                ? 'Welcome back'
                : "Let's get you set up"}
            </h2>

            <p>
              {mode === 'login'
                ? 'Sign in to your teacher verification workspace.'
                : 'Create your teacher account to verify student certificates.'}
            </p>
          </div>

          {/* ROLE SELECTOR */}

          {mode === 'signup' && (
            <div className="role-tabs">
              {ROLES.map((r) => {
                const Icon = r.icon
=======

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
                  ? 'Sign in to your teacher verification workspace.'
                  : 'Create your teacher account to verify student certificates.'
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
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8

                return (
                  <button
                    key={r.key}
<<<<<<< HEAD
                    type="button"
                    className={`role-tab ${
                      role === r.key
                        ? 'role-tab-active'
                        : ''
                    }`}
=======

                    type="button"

                    className={
                      `role-tab ${
                        role === r.key
                          ? 'role-tab-active'
                          : ''
                      }`
                    }

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
                    onClick={() => {
                      setRole(r.key)
                      setError('')
                    }}
                  >
<<<<<<< HEAD
=======

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                    />

                    {r.label}
<<<<<<< HEAD
                  </button>
                )
              })}
            </div>
          )}

          {/* FORM */}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name">
                  {role === 'institution'
                    ? 'School / institution name'
                    : 'Your name'}
                </label>

                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    handleChange('name', e.target.value)
                  }
=======

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
                      ? 'School / institution name'
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

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
                  placeholder={
                    role === 'institution'
                      ? 'e.g. Greenfield University'
                      : 'e.g. Priya Sharma'
                  }
<<<<<<< HEAD
                  autoFocus
                  autoComplete="name"
                  maxLength={200}
                  required
                />
              </div>
            )}

            <div className="form-group">
=======

                  autoFocus
                />

              </div>
            )}


            <div className="form-group">

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
              <label htmlFor="email">
                Email
              </label>

<<<<<<< HEAD
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  handleChange('email', e.target.value)
                }
                placeholder="you@example.com"
                autoFocus={mode === 'login'}
                autoComplete="email"
                maxLength={300}
                required
              />
            </div>

            <div className="form-group">
=======

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

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
              <label htmlFor="password">
                Password
              </label>

<<<<<<< HEAD
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) =>
                    handleChange('password', e.target.value)
                  }
                  placeholder={
                    mode === 'signup'
                      ? 'At least 8 characters'
                      : 'Enter your password'
                  }
=======

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

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
                  autoComplete={
                    mode === 'signup'
                      ? 'new-password'
                      : 'current-password'
                  }
<<<<<<< HEAD
                  minLength={mode === 'signup' ? 8 : 1}
                  maxLength={200}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
=======
                />


                <button
                  type="button"

                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }

>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
<<<<<<< HEAD
                  {showPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="auth-error" role="alert">
=======

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
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
                {error}
              </p>
            )}

<<<<<<< HEAD
            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={submitting}
            >
              {submitting
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Create teacher account'
                  : 'Sign in'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
=======

            <button
              type="submit"

              className="btn btn-primary auth-submit"

              disabled={submitting}
            >

              {
                submitting
                  ? 'Please wait…'
                  : mode === 'signup'
                    ? `Create teacher account`
                    : 'Sign in'
              }

            </button>

          </form>

        </motion.div>

      </div>

    </div>
  )
}
>>>>>>> c647d4676e30cfd403510d37110663e0887dacc8
