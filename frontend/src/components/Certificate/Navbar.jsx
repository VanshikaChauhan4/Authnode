import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck, Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/verify', label: 'Verify' },
  { to: '/issue', label: 'Issue' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setOpen(false)
  }, [])

  async function handleLogout() {
    await logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <ShieldCheck size={20} strokeWidth={2.2} />
          <span>AuthNode</span>
        </Link>

        <nav className="navbar-links navbar-links-desktop">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}
              end={link.to === '/'}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions navbar-actions-desktop">
          {session ? (
            <>
              <button className="btn btn-ghost navbar-dashboard-btn" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard size={16} strokeWidth={2} />
                Dashboard
              </button>
              <button className="btn btn-ghost" onClick={handleLogout}>
                <LogOut size={16} strokeWidth={2} />
                Log out
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/auth')}>
              Get started
            </button>
          )}
        </div>

        <button
          className="navbar-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="navbar-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="container navbar-mobile-inner">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}

              {session ? (
                <>
                  <NavLink to="/dashboard" className="navbar-link" onClick={() => setOpen(false)}>
                    Dashboard
                  </NavLink>
                  <button className="btn btn-ghost navbar-mobile-btn" onClick={handleLogout}>
                    <LogOut size={16} strokeWidth={2} />
                    Log out
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary navbar-mobile-btn"
                  onClick={() => {
                    setOpen(false)
                    navigate('/auth')
                  }}
                >
                  Get started
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}