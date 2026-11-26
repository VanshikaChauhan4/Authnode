import { Link } from 'react-router-dom'
import { ShieldCheck, Github } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <ShieldCheck size={18} strokeWidth={2.25} />
          <span>AuthNode</span>
        </div>

        <nav className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/verify">Verify</Link>
          <Link to="/auth">Sign in</Link>
          <a href="https://github.com/VanshikaChauhan4/Authnode" target="_blank" rel="noreferrer">
            <Github size={14} /> Source
          </a>
        </nav>

        <p className="footer-note">
          Prototype ledger \u2014 SQLite today, designed to be blockchain-ready for a future Polygon migration.
        </p>

        <p className="footer-copyright">&copy; {new Date().getFullYear()} AuthNode. Built as a learning project.</p>
      </div>
    </footer>
  )
}
