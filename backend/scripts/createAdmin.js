// Usage: node scripts/createAdmin.js "Admin Name" admin@authnode.local yourpassword
import bcrypt from 'bcryptjs'
import db from '../db/database.js'

const [, , name, email, password] = process.argv

if (!name || !email || !password) {
  console.error('Usage: node scripts/createAdmin.js "Admin Name" admin@example.com yourpassword')
  process.exit(1)
}

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase())
if (existing) {
  console.error(`A user with email ${email} already exists.`)
  process.exit(1)
}

const passwordHash = await bcrypt.hash(password, 10)
db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
  name.trim(),
  email.trim().toLowerCase(),
  passwordHash,
  'admin'
)

console.log(`Admin account created: ${email}`)
