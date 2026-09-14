import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getCurrentUser, loginUser, registerUser } from '../api/auth'
import type { User } from '../types/api'

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginDemo: () => void
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEMO_USER: User = {
  id: 'usr-clinician-demo',
  email: 'clinician@neurovision.ai',
  full_name: 'Dr. Alex Morgan (Neurology)',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('neurovision_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return DEMO_USER
      }
    }
    return DEMO_USER
  })

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return 'demo-token'
    return localStorage.getItem('neurovision_token') || 'demo-token'
  })

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('neurovision_token')
    if (!currentToken || currentToken === 'demo-token') {
      setUser(DEMO_USER)
      return DEMO_USER
    }

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      localStorage.setItem('neurovision_user', JSON.stringify(currentUser))
      return currentUser
    } catch {
      setUser(DEMO_USER)
      return DEMO_USER
    }
  }, [])

  useEffect(() => {
    const savedToken = localStorage.getItem('neurovision_token')
    if (savedToken && savedToken !== 'demo-token') {
      getCurrentUser()
        .then((profile) => {
          setUser(profile)
          localStorage.setItem('neurovision_user', JSON.stringify(profile))
        })
        .catch(() => {
          setUser(DEMO_USER)
        })
    }
  }, [])

  const loginDemo = useCallback(() => {
    localStorage.setItem('neurovision_token', 'demo-token')
    localStorage.setItem('neurovision_user', JSON.stringify(DEMO_USER))
    setToken('demo-token')
    setUser(DEMO_USER)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const tokenResponse = await loginUser({ email, password })
      const accessToken = tokenResponse.access_token
      localStorage.setItem('neurovision_token', accessToken)
      setToken(accessToken)
      const profile = await getCurrentUser()
      setUser(profile)
      localStorage.setItem('neurovision_user', JSON.stringify(profile))
    } catch (error: any) {
      // If server is 404/405/offline, gracefully log in as Clinician with provided email
      const status = error?.response?.status
      if (!status || status === 404 || status === 405 || status === 502 || status === 503) {
        const customUser: User = {
          id: `usr-${Date.now()}`,
          email,
          full_name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'Clinician',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem('neurovision_token', 'demo-token')
        localStorage.setItem('neurovision_user', JSON.stringify(customUser))
        setToken('demo-token')
        setUser(customUser)
        return
      }
      throw error
    }
  }, [])

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    try {
      const result = await registerUser({ full_name: fullName, email, password })
      if (!result?.email) {
        throw new Error('Registration failed')
      }
      await login(email, password)
    } catch (error: any) {
      const status = error?.response?.status
      if (!status || status === 404 || status === 405 || status === 502 || status === 503) {
        const customUser: User = {
          id: `usr-${Date.now()}`,
          email,
          full_name: fullName.trim() || 'Clinician',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem('neurovision_token', 'demo-token')
        localStorage.setItem('neurovision_user', JSON.stringify(customUser))
        setToken('demo-token')
        setUser(customUser)
        return
      }
      throw error
    }
  }, [login])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('neurovision_token')
    localStorage.removeItem('neurovision_user')
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token),
    login,
    loginDemo,
    register,
    logout,
    refreshUser,
  }), [user, token, login, loginDemo, register, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
