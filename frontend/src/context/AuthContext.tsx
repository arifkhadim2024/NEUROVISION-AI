import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getCurrentUser, loginUser, registerUser } from '../api/auth'
import type { User } from '../types/api'

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    return localStorage.getItem('neurovision_token')
  })

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('neurovision_token')
    if (!currentToken) {
      setUser(null)
      return null
    }

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch {
      setToken(null)
      setUser(null)
      localStorage.removeItem('neurovision_token')
      return null
    }
  }, [])

  useEffect(() => {
    const savedToken = localStorage.getItem('neurovision_token')
    if (savedToken) {
      getCurrentUser()
        .then((profile) => setUser(profile))
        .catch(() => {
          setToken(null)
          setUser(null)
          localStorage.removeItem('neurovision_token')
        })
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokenResponse = await loginUser({ email, password })
    const accessToken = tokenResponse.access_token
    localStorage.setItem('neurovision_token', accessToken)
    setToken(accessToken)
    const profile = await getCurrentUser()
    setUser(profile)
  }, [])

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const result = await registerUser({ full_name: fullName, email, password })

    if (!result?.email) {
      throw new Error('Registration failed')
    }

    await login(email, password)
  }, [login])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('neurovision_token')
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
    refreshUser,
  }), [user, token, login, register, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
