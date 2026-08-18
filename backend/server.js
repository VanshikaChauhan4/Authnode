import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import certificateRoutes from './routes/certificates.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/admin', adminRoutes)

// Fallback error handler — keeps errors JSON instead of leaking HTML/stack traces
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

app.listen(PORT, () => {
  console.log(`AuthNode backend running on http://localhost:${PORT}`)
})
