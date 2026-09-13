import { useQuery } from '@tanstack/react-query'
import { Activity, ArrowUpRight, BrainCircuit, CalendarRange, Gauge, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { apiClient } from '../api/client'
import type { DashboardActivityItem, DashboardDistributionItem, DashboardStats } from '../types/api'

const palette = ['#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#f43f5e']

export function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardStats>('/api/dashboard/stats')
      return data
    },
  })

  const activityQuery = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardActivityItem[]>('/api/dashboard/activity')
      return data
    },
  })

  const distributionQuery = useQuery({
    queryKey: ['dashboard-distribution'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardDistributionItem[]>('/api/dashboard/distribution')
      return data
    },
  })

  if (statsQuery.isLoading || activityQuery.isLoading || distributionQuery.isLoading) {
    return <div className="page-panel"><p>Loading dashboard...</p></div>
  }

  const stats = statsQuery.data
  const activity = activityQuery.data ?? []
  const distribution = distributionQuery.data ?? []

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Clinical dashboard</h2>
        </div>
        <Link to="/app/upload" className="button button-primary">New analysis</Link>
      </div>

      <section className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon blue"><BrainCircuit size={18} /></div>
          <div>
            <p>Total analyses</p>
            <h3>{stats?.total_analyses ?? 0}</h3>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon green"><Activity size={18} /></div>
          <div>
            <p>This week</p>
            <h3>{stats?.analyses_this_week ?? 0}</h3>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon orange"><Gauge size={18} /></div>
          <div>
            <p>Avg confidence</p>
            <h3>{stats ? `${stats.average_confidence.toFixed(1)}%` : '0.0%'}</h3>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon purple"><ShieldCheck size={18} /></div>
          <div>
            <p>Model version</p>
            <h3>{stats?.model_version || 'Unspecified'}</h3>
          </div>
        </div>
      </section>

      <section className="panel-grid">
        <div className="glass-card panel-card chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h3>30-day volume</h3>
            </div>
            <CalendarRange size={16} />
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3b3b52" />
                <XAxis dataKey="date" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card panel-card distribution-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Distribution</p>
              <h3>Prediction mix</h3>
            </div>
            <ArrowUpRight size={16} />
          </div>

          {distribution.length ? (
            <div className="distribution-list">
              {distribution.map((entry, index) => (
                <div key={`${entry.label}-${index}`} className="distribution-item">
                  <div className="distribution-meta">
                    <span className="legend-dot" style={{ background: palette[index % palette.length] }} />
                    <span>{entry.label}</span>
                  </div>
                  <strong>{entry.count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No predictions yet. Upload an image to populate this chart.</p>
          )}
        </div>
      </section>
    </div>
  )
}
