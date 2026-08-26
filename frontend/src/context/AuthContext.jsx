import { createContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const data = await api.session()

      setUser(data.user || data)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (payload) => {
    const data = await api.login(payload)

    await checkSession()

    return data
  }

  const signup = async (payload) => {
    const data = await api.signup(payload)

    await checkSession()

    return data
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        checkSession,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}