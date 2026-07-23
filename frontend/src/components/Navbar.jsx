import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <ShieldCheck size={20} strokeWidth={2.25} />
          <span>AuthNode</span>
        </Link>

        <nav className="navbar-links">
          <Link to="/verify">Verify</Link>
          {session?.role === 'institution' && <Link to="/issue">Issue</Link>}
          {session?.role === 'student' && <Link to="/dashboard">Dashboard</Link>}
        </nav>

        <div className="navbar-session">
          {session ? (
            <button className="navbar-user" onClick={handleLogout}>
              <span>{session.name}</span>
              <LogOut size={15} />
            </button>
          ) : (
            <Link to="/auth" className="btn btn-primary navbar-cta">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
