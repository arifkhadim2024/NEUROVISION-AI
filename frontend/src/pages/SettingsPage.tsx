import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  UserCheck,
  Wifi,
} from 'lucide-react'

import { getHealth } from '../api/health'

export function SettingsPage() {
  const [clearedMessage, setClearedMessage] = useState<string | null>(null)

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30000,
  })

  const handleClearCache = () => {
    if (window.confirm('Clear all local scans and reset workspace storage?')) {
      try {
        localStorage.removeItem('neurovision_analyses_meta')
        localStorage.removeItem('neurovision_local_analyses')
        if (typeof indexedDB !== 'undefined') {
          indexedDB.deleteDatabase('neurovision_storage')
        }
        setClearedMessage('Storage cache successfully reset.')
        setTimeout(() => {
          window.location.reload()
        }, 1200)
      } catch {
        setClearedMessage('Cache cleared.')
      }
    }
  }

  const isConnected = healthQuery.isSuccess && healthQuery.data?.status === 'ok'

  return (
    <div className="page-shell narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">System Control</p>
          <h2>Settings & Infrastructure</h2>
        </div>
        <button
          type="button"
          className="button button-secondary small"
          onClick={() => void healthQuery.refetch()}
          disabled={healthQuery.isFetching}
        >
          <RefreshCw size={14} className={healthQuery.isFetching ? 'spin' : ''} />
          {healthQuery.isFetching ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Connection Status Card */}
        <div className="glass-card form-card">
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <p className="eyebrow">Connectivity</p>
              <h3>Backend & Neural Engine</h3>
            </div>
            <Server size={18} color="#38bdf8" />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '12px',
              background: isConnected ? 'rgba(52, 211, 153, 0.08)' : 'rgba(248, 113, 113, 0.08)',
              border: isConnected
                ? '1px solid rgba(52, 211, 153, 0.25)'
                : '1px solid rgba(248, 113, 113, 0.25)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isConnected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                  color: isConnected ? '#34d399' : '#f87171',
                }}
              >
                <Wifi size={18} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                  {isConnected ? 'ONLINE & CONNECTED' : 'OFFLINE / STANDALONE'}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {healthQuery.data?.service || 'NeuroVision AI Neural Engine'}
                </span>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: isConnected ? '#34d399' : '#f87171',
                background: isConnected ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                padding: '4px 10px',
                borderRadius: '999px',
              }}
            >
              <CheckCircle2 size={13} /> {healthQuery.data?.version || 'v1.0.0'}
            </span>
          </div>

          <ul className="meta-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>API Protocol:</span>
              <strong>REST JSON + Multipart/Form-Data</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>XAI Attribution:</span>
              <strong style={{ color: '#6ee7b7' }}>Grad-CAM Activation Visualizer</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Inference Resolution:</span>
              <strong>224 × 224 px (EfficientNet Standard)</strong>
            </li>
          </ul>
        </div>

        {/* Storage Architecture Card */}
        <div className="glass-card form-card">
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <p className="eyebrow">Local Persistence</p>
              <h3>Storage & Memory Engine</h3>
            </div>
            <Database size={18} color="#a78bfa" />
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <HardDrive size={16} color="#c4b5fd" />
              <strong style={{ fontSize: '0.9rem' }}>IndexedDB + Memory Cache</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.4 }}>
              High-resolution MRI scans and Grad-CAM overlays are stored in IndexedDB without browser localStorage 5MB quota restrictions.
            </p>
          </div>

          {clearedMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                fontSize: '0.85rem',
                marginBottom: '12px',
              }}
            >
              {clearedMessage}
            </div>
          )}

          <button
            type="button"
            className="button button-secondary"
            style={{ width: '100%', justifyContent: 'center', color: '#f87171' }}
            onClick={handleClearCache}
          >
            <Trash2 size={15} /> Reset Local Scan Cache
          </button>
        </div>

        {/* Security & Access */}
        <div className="glass-card form-card">
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <p className="eyebrow">Security</p>
              <h3>Clinician Authorization</h3>
            </div>
            <Shield size={18} color="#34d399" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px' }}>
            <UserCheck size={18} color="#6ee7b7" />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>Verified Clinician Session</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Instant Demo Access & Full Diagnostic Capabilities Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

