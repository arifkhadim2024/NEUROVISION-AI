import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrainCircuit, History, LayoutDashboard, LogOut, Settings, Upload } from 'lucide-react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'

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
  const location = useLocation()
  const isAppRoute = location.pathname.startsWith('/app')

  if (!isAppRoute) {
    return (
      <main className="public-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/app" className="sidebar-brand-wrap" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand-mark small">N</div>
          <div className="sidebar-brand">NEUROVISION</div>
        </Link>

        <nav className="sidebar-nav">
          <Link to="/app" className={location.pathname === '/app' ? 'active-nav' : ''}>
            <LayoutDashboard size={17} /> Overview
          </Link>
          <Link to="/app/upload" className={location.pathname === '/app/upload' ? 'active-nav' : ''}>
            <Upload size={17} /> Upload
          </Link>
          <Link to="/app/history" className={location.pathname === '/app/history' ? 'active-nav' : ''}>
            <History size={17} /> History
          </Link>
          <Link to="/app/model" className={location.pathname === '/app/model' ? 'active-nav' : ''}>
            <BrainCircuit size={17} /> Model
          </Link>
          <Link to="/app/settings" className={location.pathname === '/app/settings' ? 'active-nav' : ''}>
            <Settings size={17} /> Settings
          </Link>
        </nav>

        {isAuthenticated ? (
          <div className="user-panel" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p className="eyebrow" style={{ fontSize: '0.65rem' }}>Signed in as</p>
              <strong style={{ fontSize: '0.9rem', color: '#f1f5f9', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.full_name || 'Clinician'}
              </strong>
              <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{user?.email}</small>
            </div>
            <button
              type="button"
              className="button button-secondary small wide"
              onClick={logout}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        ) : null}
      </aside>

      <main className="main-panel">
        <Routes>
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
          <Route path="*" element={<Navigate to="/app" replace />} />
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
