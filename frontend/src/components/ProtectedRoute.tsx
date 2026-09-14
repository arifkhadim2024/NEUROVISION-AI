import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loginDemo } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      loginDemo()
    }
  }, [isAuthenticated, loginDemo])

  return <>{children}</>
}
