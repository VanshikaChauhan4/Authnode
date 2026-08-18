import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken, clearToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { user } = await api.me()
        setUser(user)
      } catch {
        clearToken()
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  async function signup(payload) {
    const { token, user } = await api.signup(payload)
    setToken(token)
    setUser(user)
    return user
  }

  async function login(payload) {
    const { token, user } = await api.login(payload)
    setToken(token)
    setUser(user)
    return user
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
