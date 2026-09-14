import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loginDemo } = useAuth()

  if (!isAuthenticated) {
    loginDemo()
  }

  return <>{children}</>
}
