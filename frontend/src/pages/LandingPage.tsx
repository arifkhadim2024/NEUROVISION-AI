import { ArrowRight, BrainCircuit, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">N</div>
          <div>
            <p className="eyebrow">Medical AI platform</p>
            <h1>NEUROVISION AI</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <Link to="/login" className="button button-secondary">Log in</Link>
          <Link to="/register" className="button button-primary">Get started</Link>
        </div>
      </header>

      <main className="hero-section">
        <div className="hero-copy">
          <span className="pill"><Sparkles size={14} /> AI diagnostics</span>
          <h2>Clinical imaging insights for faster, safer decisions.</h2>
          <p>
            Upload medical scans, run AI-assisted classification, and track model performance from a single,
            secure workflow built for modern care teams.
          </p>
          <div className="hero-actions">
            <Link to="/app/upload" className="button button-primary large">
              Start analysis <ArrowRight size={18} />
            </Link>
            <Link to="/app" className="button button-secondary large">View dashboard</Link>
          </div>
          <ul className="hero-points">
            <li><ShieldCheck size={16} /> HIPAA-ready workflow design</li>
            <li><BrainCircuit size={16} /> ML inference pipeline</li>
            <li><Stethoscope size={16} /> Radiology-first reporting</li>
          </ul>
        </div>

        <div className="hero-panel">
          <div className="stats-card glass-card">
            <div className="mini-label">Model status</div>
            <div className="metric-row">
              <span className="metric-value">93.4%</span>
              <span className="metric-note positive">accuracy</span>
            </div>
            <div className="mini-progress"><span style={{ width: '93%' }} /></div>
          </div>

          <div className="feature-stack">
            <div className="glass-card feature-box">
              <span className="icon-wrap"><BrainCircuit size={18} /></span>
              <div>
                <p>Deep learning review</p>
                <small>Class probabilities + confidence</small>
              </div>
            </div>
            <div className="glass-card feature-box">
              <span className="icon-wrap"><Stethoscope size={18} /></span>
              <div>
                <p>Care team visibility</p>
                <small>Audit-ready analysis history</small>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
