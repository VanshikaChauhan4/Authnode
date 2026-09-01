import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const data = await api.session()

        if (!active) return

        setUser(data.user || data)
      } catch (error) {
        if (!active) return

        setUser(null)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  const login = async (payload) => {
    const data = await api.login(payload)

    const loggedInUser = data.user || data

    setUser(loggedInUser)

    return data
  }

  const signup = async (payload) => {
    const data = await api.signup(payload)

    const createdUser = data.user || data

    setUser(createdUser)

    return data
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
    }
  }

  const refreshSession = async () => {
    try {
      const data = await api.session()

      const currentUser = data.user || data

      setUser(currentUser)

      return currentUser
    } catch (error) {
      setUser(null)

      return null
    }
  }

  const value = {
    user,
    setUser,
    loading,
    login,
    signup,
    logout,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}