import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Cpu,
  FileImage,
  Layers,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deleteAnalysis, getAnalysisById } from '../api/analyses'
import { apiClient } from '../api/client'

export function AnalysisDetailPage() {
  const { analysisId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'overlay' | 'heatmap' | 'original'>('overlay')
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null)
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null)

  const analysisQuery = useQuery({
    queryKey: ['analysis', analysisId],
    enabled: Boolean(analysisId),
    queryFn: async () => {
      if (!analysisId) throw new Error('Missing analysis ID')
      return getAnalysisById(analysisId)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!analysisId) return
      await deleteAnalysis(analysisId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      navigate('/app/history')
    },
  })

  const analysis = analysisQuery.data

  useEffect(() => {
    if (!analysis) return

    let origObjUrl: string | null = null
    let heatObjUrl: string | null = null
    let overObjUrl: string | null = null

    async function loadMedia(path: string | null, setter: (url: string | null) => void) {
      if (!path) {
        setter(null)
        return null
      }
      try {
        const response = await apiClient.get(path, { responseType: 'blob' })
        const url = URL.createObjectURL(response.data)
        setter(url)
        return url
      } catch {
        setter(null)
        return null
      }
    }

    void loadMedia(analysis.original_image_url, (url) => {
      origObjUrl = url
      setOriginalUrl(url)
    })

    void loadMedia(analysis.heatmap_url, (url) => {
      heatObjUrl = url
      setHeatmapUrl(url)
    })

    void loadMedia(analysis.overlay_url, (url) => {
      overObjUrl = url
      setOverlayUrl(url)
    })

    return () => {
      if (origObjUrl) URL.revokeObjectURL(origObjUrl)
      if (heatObjUrl) URL.revokeObjectURL(heatObjUrl)
      if (overObjUrl) URL.revokeObjectURL(overObjUrl)
    }
  }, [analysis])

  if (analysisQuery.isLoading) {
    return (
      <div className="page-panel">
        <p>Loading analysis details...</p>
      </div>
    )
  }

  if (analysisQuery.isError || !analysis) {
    return (
      <div className="page-panel">
        <p>Analysis not found.</p>
        <Link to="/app/history" className="button button-secondary" style={{ marginTop: '16px' }}>
          Back to history
        </Link>
      </div>
    )
  }

  const confidence = analysis.prediction
    ? analysis.prediction.confidence <= 1
      ? analysis.prediction.confidence * 100
      : analysis.prediction.confidence
    : 0

  const displayedImage =
    activeTab === 'overlay'
      ? overlayUrl || originalUrl
      : activeTab === 'heatmap'
      ? heatmapUrl || originalUrl
      : originalUrl

  const probabilities = (analysis.predictions || []) as Array<{
    label: string
    probability: number
  }>

  return (
    <div className="page-shell narrow">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/app/history" className="button button-secondary small" title="Back to history">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="eyebrow">Analysis Case #{analysis.id.slice(0, 8)}</p>
            <h2>{analysis.original_filename ?? `Case ${analysis.id}`}</h2>
          </div>
        </div>
        <button
          type="button"
          className="button button-secondary small"
          style={{ color: '#f87171' }}
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this analysis?')) {
              deleteMutation.mutate()
            }
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={16} /> {deleteMutation.isPending ? 'Deleting...' : 'Delete case'}
        </button>
      </div>

      <div className="analysis-detail-grid">
        <div className="glass-card detail-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Primary diagnosis</p>
              <h3 style={{ textTransform: 'capitalize' }}>
                {analysis.prediction?.label ?? 'Pending'}
              </h3>
            </div>
            <ShieldCheck size={18} color="#34d399" />
          </div>

          <div className="detail-metrics">
            <div>
              <small>Confidence</small>
              <strong style={{ fontSize: '1.4rem', color: '#6ee7b7' }}>
                {analysis.prediction ? `${confidence.toFixed(1)}%` : '0.0%'}
              </strong>
            </div>

            <div>
              <small>Status</small>
              <strong style={{ textTransform: 'capitalize' }}>{analysis.status}</strong>
            </div>

            <div>
              <small>Latency</small>
              <strong>{analysis.processing_time_ms ? `${analysis.processing_time_ms} ms` : 'N/A'}</strong>
            </div>
          </div>

          {analysis.error_message ? (
            <div className="error-box">
              <AlertTriangle size={16} />
              <span>{analysis.error_message}</span>
            </div>
          ) : null}

          {probabilities.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p className="eyebrow" style={{ marginBottom: '10px' }}>
                Class probabilities
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {probabilities.map((item, idx) => {
                  const probPercent =
                    item.probability <= 1 ? item.probability * 100 : item.probability
                  const isTop = item.label === analysis.prediction?.label
                  return (
                    <div key={idx} style={{ fontSize: '0.85rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '3px',
                          color: isTop ? '#e5eefb' : 'var(--muted)',
                          fontWeight: isTop ? 600 : 400,
                          textTransform: 'capitalize',
                        }}
                      >
                        <span>{item.label}</span>
                        <span>{probPercent.toFixed(1)}%</span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          borderRadius: '999px',
                          background: 'rgba(148, 163, 184, 0.15)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, Math.max(0, probPercent))}%`,
                            background: isTop
                              ? 'linear-gradient(90deg, #7c3aed, #22d3ee)'
                              : 'rgba(148, 163, 184, 0.4)',
                            borderRadius: 'inherit',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card detail-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Clinical metadata</p>
              <h3>Case overview</h3>
            </div>
            <Cpu size={18} />
          </div>

          <ul className="meta-list">
            <li>
              <UserRound size={15} />
              <span>Patient ID:</span> {analysis.patient_id || 'Not specified'}
            </li>
            <li>
              <Activity size={15} />
              <span>Scan Type:</span> {analysis.scan_type || 'Brain MRI'}
            </li>
            <li>
              <Clock3 size={15} />
              <span>Created:</span>{' '}
              {analysis.created_at ? new Date(analysis.created_at).toLocaleString() : 'N/A'}
            </li>
            <li>
              <FileImage size={15} />
              <span>Source scan:</span> {analysis.original_filename ?? 'Medical scan'}
            </li>
            <li>
              <Sparkles size={15} />
              <span>Model Architecture:</span> {analysis.model_name ?? 'NeuroVision EfficientNet-B0'}
            </li>
            <li>
              <ShieldCheck size={15} />
              <span>Model Version:</span> {analysis.model_version ?? '1.0.0'}
            </li>
          </ul>

          {analysis.notes || analysis.note ? (
            <div style={{ marginTop: '18px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
              <p className="eyebrow">Clinical Notes</p>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                {analysis.notes || analysis.note}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
        <div className="panel-heading" style={{ marginBottom: '16px' }}>
          <div>
            <p className="eyebrow">Explainable AI (XAI)</p>
            <h3>Grad-CAM visual attribution</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`button small ${activeTab === 'overlay' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('overlay')}
            >
              <Layers size={14} /> Overlay Blend
            </button>
            <button
              type="button"
              className={`button small ${activeTab === 'heatmap' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('heatmap')}
            >
              Heatmap
            </button>
            <button
              type="button"
              className={`button small ${activeTab === 'original' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setActiveTab('original')}
            >
              Original MRI
            </button>
          </div>
        </div>

        {displayedImage ? (
          <div className="image-preview" style={{ marginTop: '0', display: 'flex', justifyContent: 'center' }}>
            <img
              src={displayedImage}
              alt={activeTab}
              style={{ maxHeight: '480px', objectFit: 'contain', width: 'auto' }}
            />
          </div>
        ) : (
          <div className="page-panel">
            <p>Loading medical scan visualization...</p>
          </div>
        )}
      </div>
    </div>
  )
}