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
    if (!token) {
      setUser(null)
      return null
    }

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      setToken(null)
      setUser(null)
      localStorage.removeItem('neurovision_token')
      return null
    }
  }, [token])

  useEffect(() => {
    if (token) {
      localStorage.setItem('neurovision_token', token)
      void refreshUser()
      return
    }

    localStorage.removeItem('neurovision_token')
    setUser(null)
  }, [token, refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const tokenResponse = await loginUser({ email, password })
    setToken(tokenResponse.access_token)
    const profile = await refreshUser()
    if (!profile) {
      throw new Error('Unable to load user profile')
    }
  }, [refreshUser])

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
  }), [login, logout, refreshUser, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
