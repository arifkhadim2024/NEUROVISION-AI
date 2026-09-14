import { useState, type FormEvent } from 'react'
import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await register(fullName, email, password)
      navigate('/app')
    } catch (submitError: any) {
      const serverDetail = submitError?.response?.data?.detail
      setError(
        typeof serverDetail === 'string'
          ? serverDetail
          : submitError instanceof Error
          ? submitError.message
          : 'Unable to create account.'
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
            <p className="eyebrow">Create account</p>
            <h2>Start with NEUROVISION AI</h2>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <div className="input-wrap">
              <UserRound size={16} />
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Dr. Ada Martinez" required />
            </div>
          </label>

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
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="At least 8 characters" required />
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button-primary wide" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
