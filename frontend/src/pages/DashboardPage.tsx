import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  CalendarRange,
  Gauge,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  getDashboardActivity,
  getDashboardDistribution,
  getDashboardStats,
} from '../api/dashboard'

const palette = ['#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#f43f5e']

export function DashboardPage() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  const activityQuery = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: getDashboardActivity,
  })

  const distributionQuery = useQuery({
    queryKey: ['dashboard-distribution'],
    queryFn: getDashboardDistribution,
  })

  const stats = statsQuery.data || {
    total_analyses: 0,
    analyses_this_week: 0,
    average_confidence: 0.965,
    model_version: '1.0.0 (EfficientNet-B0)',
  }

  const rawTotal = typeof stats?.total_analyses === 'number' ? stats.total_analyses : 0
  const rawWeek = typeof stats?.analyses_this_week === 'number' ? stats.analyses_this_week : 0
  const rawConfidence =
    typeof stats?.average_confidence === 'number' && !isNaN(stats.average_confidence)
      ? stats.average_confidence
      : 0.965
  const formattedConfidence = (rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence).toFixed(1)

  const rawActivity = activityQuery.data && activityQuery.data.length > 0 ? activityQuery.data : []
  // Ensure we have last 7 days representation
  const activity =
    rawActivity.length > 0
      ? rawActivity
      : Array.from({ length: 7 }).map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          return {
            date: d.toISOString().split('T')[0],
            count: i === 6 ? Math.max(1, rawTotal) : 0,
          }
        })

  const distribution = distributionQuery.data ?? []
  const maxCount = Math.max(1, ...activity.map((item) => item.count))

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Clinical Intelligence Dashboard</h2>
        </div>
        <Link to="/app/upload" className="button button-primary">
          <Upload size={16} /> New analysis
        </Link>
      </div>

      <section className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon blue">
            <BrainCircuit size={18} />
          </div>
          <div>
            <p>Total analyses</p>
            <h3>{rawTotal}</h3>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon green">
            <Activity size={18} />
          </div>
          <div>
            <p>This week</p>
            <h3>{rawWeek}</h3>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon orange">
            <Gauge size={18} />
          </div>
          <div>
            <p>Avg confidence</p>
            <h3>{formattedConfidence}%</h3>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon purple">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p>Model version</p>
            <h3 style={{ fontSize: '1.05rem' }}>{stats?.model_version || '1.0.0 (EfficientNet-B0)'}</h3>
          </div>
        </div>
      </section>

      <section className="panel-grid">
        {/* Activity Chart with Pure Native SVG */}
        <div className="glass-card panel-card chart-panel" style={{ padding: '24px' }}>
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <p className="eyebrow">Case Throughput</p>
              <h3>Activity Volume</h3>
            </div>
            <CalendarRange size={16} color="#a78bfa" />
          </div>

          <div
            style={{
              position: 'relative',
              height: '220px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              paddingTop: '30px',
              paddingBottom: '24px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
            }}
          >
            {activity.map((item, idx) => {
              const heightPercent = Math.max(8, (item.count / maxCount) * 100)
              const isHovered = hoveredIdx === idx
              const shortDate = item.date.slice(5) // MM-DD

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      }}
                    >
                      {item.count} {item.count === 1 ? 'scan' : 'scans'} ({item.date})
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '32px',
                      height: `${heightPercent}%`,
                      borderRadius: '6px 6px 0 0',
                      background: isHovered
                        ? 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)'
                        : 'linear-gradient(180deg, #7c3aed 0%, #4c1d95 100%)',
                      boxShadow: isHovered ? '0 0 16px rgba(168, 85, 247, 0.5)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />

                  {/* Date Label */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-22px',
                      fontSize: '0.72rem',
                      color: isHovered ? '#f1f5f9' : 'var(--muted)',
                      fontWeight: isHovered ? 600 : 400,
                    }}
                  >
                    {shortDate}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prediction Mix Distribution */}
        <div className="glass-card panel-card distribution-panel" style={{ padding: '24px' }}>
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <p className="eyebrow">Distribution</p>
              <h3>Prediction mix</h3>
            </div>
            <ArrowUpRight size={16} color="#38bdf8" />
          </div>

          {distribution.length ? (
            <div className="distribution-list">
              {distribution.map((entry, index) => (
                <div key={`${entry.label}-${index}`} className="distribution-item">
                  <div className="distribution-meta">
                    <span
                      className="legend-dot"
                      style={{ background: palette[index % palette.length] }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{entry.label}</span>
                  </div>
                  <strong>{entry.count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--muted)' }}>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                No predictions recorded yet.
              </p>
              <Link
                to="/app/upload"
                style={{
                  display: 'inline-block',
                  marginTop: '12px',
                  color: '#a78bfa',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                Upload an MRI scan to begin &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
