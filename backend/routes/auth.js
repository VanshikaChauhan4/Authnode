import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db/database.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { logEvent } from '../services/auditLog.js'

const router = Router()

const VALID_ROLES = ['institution', 'student', 'employer']

router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name?.trim() || !email?.trim() || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are all required.' })
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be institution, student, or employer.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase())
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.trim().toLowerCase(), passwordHash, role)

  const user = { id: result.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase(), role }
  const token = signToken(user)

  logEvent({ eventType: 'user_signup', actorLabel: `${user.email} (${user.role})` })

  res.status(201).json({ token, user })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase())
  if (!row) {
    return res.status(401).json({ error: 'No account found with that email.' })
  }

  const valid = await bcrypt.compare(password, row.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }

  const user = { id: row.id, name: row.name, email: row.email, role: row.role }
  const token = signToken(user)

  logEvent({ eventType: 'user_login', actorLabel: `${user.email} (${user.role})` })

  res.json({ token, user })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

export default router
