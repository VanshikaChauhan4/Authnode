import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  fetchSession,
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
} from '../lib/ledger'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchSession().then((s) => {
      if (!cancelled) setSession(s)
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (name, role, password) => {
    const s = await apiLogin(name, role, password)
    setSession(s)
    return s
  }, [])

  const signup = useCallback(async (name, role, password) => {
    const s = await apiSignup(name, role, password)
    setSession(s)
    return s
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
