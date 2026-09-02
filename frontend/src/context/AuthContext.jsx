import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  api,
  getToken,
  clearToken,
} from '../lib/api'


const AuthContext =
  createContext(null)


export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null)

  const [loading, setLoading] =
    useState(true)


  // ==========================================================
  // RESTORE LOGIN SESSION
  // ==========================================================

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const token = getToken()

      // There is no logged-in session
      // if no JWT exists.
      if (!token) {
        if (active) {
          setUser(null)
          setLoading(false)
        }

        return
      }


      try {
        const data =
          await api.session()

        if (!active) return

        const currentUser =
          data?.user || data

        if (currentUser) {
          setUser(currentUser)
        } else {
          setUser(null)
        }

      } catch (error) {
        if (!active) return

        console.error(
          'Could not restore AuthNode session:',
          error
        )

        /*
         * IMPORTANT:
         *
         * Do NOT immediately delete the token for every
         * possible error.
         *
         * A temporary backend/network error should not
         * randomly log the user out.
         *
         * If the backend explicitly says the token is
         * invalid/expired, clear it.
         */

        const message =
          error?.message?.toLowerCase() || ''

        const isUnauthorized =
          message.includes('401') ||
          message.includes('unauthorized') ||
          message.includes('token') &&
          (
            message.includes('expired') ||
            message.includes('invalid')
          )

        if (isUnauthorized) {
          clearToken()
          setUser(null)
        }

        /*
         * For temporary backend errors we leave the token
         * untouched.
         *
         * The UI will finish loading instead of deleting
         * a perfectly valid login token.
         */
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


  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (payload) => {
    const data =
      await api.login(payload)

    const loggedInUser =
      data?.user || data

    setUser(loggedInUser)

    return data
  }


  // ==========================================================
  // SIGNUP
  // ==========================================================

  const signup = async (payload) => {
    const data =
      await api.signup(payload)

    const createdUser =
      data?.user || data

    setUser(createdUser)

    return data
  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      clearToken()
      setUser(null)
    }
  }


  // ==========================================================
  // REFRESH SESSION
  // ==========================================================

  const refreshSession = async () => {
    const token = getToken()

    if (!token) {
      setUser(null)
      return null
    }


    try {
      const data =
        await api.session()

      const currentUser =
        data?.user || data

      setUser(currentUser)

      return currentUser

    } catch (error) {
      console.error(
        'Could not refresh AuthNode session:',
        error
      )

      const message =
        error?.message?.toLowerCase() || ''

      const isUnauthorized =
        message.includes('401') ||
        message.includes('unauthorized') ||
        (
          message.includes('token') &&
          (
            message.includes('expired') ||
            message.includes('invalid')
          )
        )

      if (isUnauthorized) {
        clearToken()
        setUser(null)
      }

      return null
    }
  }


  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

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
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}


// ============================================================
// USE AUTH
// ============================================================

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}