import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="page">
      <div className="container">
        <motion.div
          className="card not-found-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Compass size={40} strokeWidth={1.4} />
          <span className="eyebrow">404</span>
          <h2>This page doesn&apos;t exist</h2>
          <p>
            The link may be broken, or the page may have moved. If you were
            trying to check a certificate, use Verify below.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-ghost">Go home</Link>
            <Link to="/verify" className="btn btn-primary">Verify a certificate</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
