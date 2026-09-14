import { useState, type FormEvent } from 'react'
import { LockKeyhole, Mail, Sparkles, UploadCloud } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      navigate('/app/upload')
    } catch (submitError: any) {
      const serverDetail = submitError?.response?.data?.detail
      setError(
        typeof serverDetail === 'string'
          ? serverDetail
          : submitError instanceof Error
          ? submitError.message
          : 'Unable to sign in.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleInstantAccess() {
    loginDemo()
    navigate('/app/upload')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark small">N</div>
          <div>
            <p className="eyebrow">Diagnostic Suite</p>
            <h2>Sign in to NEUROVISION AI</h2>
          </div>
        </div>

        <button
          type="button"
          className="button button-primary wide"
          style={{
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '0.9rem',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
          }}
          onClick={handleInstantAccess}
        >
          <Sparkles size={18} /> Instant Access (Upload & Analyze Scans)
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '0 0 18px',
            color: 'var(--muted)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
          <span>or sign in with credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="clinician@hospital.org"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button-secondary wide" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <Link to="/register" style={{ color: '#8fb7ff' }}>Create account</Link>
          <Link to="/app/upload" style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <UploadCloud size={14} /> Go directly to Upload
          </Link>
        </div>
      </div>
    </div>
  )
}
