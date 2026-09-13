import { useQuery } from '@tanstack/react-query'
import { Wifi, WifiOff } from 'lucide-react'

import { getHealth } from '../api/health'

export function SettingsPage() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  })

  return (
    <div className="page-shell narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>System status</h2>
        </div>
      </div>

      <div className="glass-card form-card">
        <div className="status-row">
          <span>Backend:</span>
          {healthQuery.isLoading ? (
            <span className="status pending">Checking...</span>
          ) : healthQuery.isSuccess ? (
            <span className="status connected">CONNECTED {healthQuery.data.status === 'ok' ? <Wifi size={16} /> : <WifiOff size={16} />}</span>
          ) : (
            <span className="status disconnected">DISCONNECTED <WifiOff size={16} /></span>
          )}
        </div>

        {healthQuery.data ? (
          <ul className="meta-list">
            <li><span>Service:</span> {healthQuery.data.service}</li>
            <li><span>Version:</span> {healthQuery.data.version}</li>
          </ul>
        ) : null}
      </div>
    </div>
  )
}
