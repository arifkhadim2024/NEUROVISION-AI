import { useState, type FormEvent } from 'react'
import { LockKeyhole, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
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
      navigate('/app')
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark small">N</div>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to NEUROVISION AI</h2>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={16} />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@clinic.com" required />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <LockKeyhole size={16} />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button-primary wide" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          New to the platform? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  )
}
