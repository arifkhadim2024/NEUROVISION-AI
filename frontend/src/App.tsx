import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AnalysisDetailPage } from './pages/AnalysisDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ModelPage } from './pages/ModelPage'
import { RegisterPage } from './pages/RegisterPage'
import { SettingsPage } from './pages/SettingsPage'
import { UploadPage } from './pages/UploadPage'

const queryClient = new QueryClient()

function AppShell() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">NEUROVISION</div>
        <nav className="sidebar-nav">
          <Link to="/app">Overview</Link>
          <Link to="/app/upload">Upload</Link>
          <Link to="/app/history">History</Link>
          <Link to="/app/model">Model</Link>
          <Link to="/app/settings">Settings</Link>
        </nav>

        {isAuthenticated ? (
          <div className="user-panel">
            <div>
              <p className="eyebrow">Signed in</p>
              <strong>{user?.full_name || 'Clinician'}</strong>
            </div>
            <button type="button" className="button button-secondary small" onClick={logout}>Log out</button>
          </div>
        ) : null}
      </aside>

      <main className="main-panel">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/model"
            element={
              <ProtectedRoute>
                <ModelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/analysis/:analysisId"
            element={
              <ProtectedRoute>
                <AnalysisDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
