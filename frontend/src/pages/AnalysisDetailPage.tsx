import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock3, Cpu, FileImage, ShieldCheck } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { apiClient } from '../api/client'
import type { AnalysisDetail } from '../types/api'

export function AnalysisDetailPage() {
  const { analysisId } = useParams()

  const analysisQuery = useQuery({
    queryKey: ['analysis', analysisId],
    enabled: Boolean(analysisId),
    queryFn: async () => {
      const { data } = await apiClient.get<AnalysisDetail>(`/api/analyses/${analysisId}`)
      return data
    },
  })

  if (analysisQuery.isLoading) {
    return <div className="page-panel"><p>Loading analysis...</p></div>
  }

  if (analysisQuery.isError || !analysisQuery.data) {
    return <div className="page-panel"><p>Analysis not found.</p></div>
  }

  const analysis = analysisQuery.data

  return (
    <div className="page-shell narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Analysis details</p>
          <h2>{analysis.original_filename ?? `Case ${analysis.id}`}</h2>
        </div>
      </div>

      <div className="analysis-detail-grid">
        <div className="glass-card detail-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Prediction</p>
              <h3>{analysis.prediction?.label ?? 'Pending'}</h3>
            </div>
            <ShieldCheck size={16} />
          </div>

          <div className="detail-metrics">
            <div>
              <small>Confidence</small>
              <strong>{analysis.prediction ? `${analysis.prediction.confidence.toFixed(1)}%` : '0.0%'}</strong>
            </div>
            <div>
              <small>Status</small>
              <strong>{analysis.status}</strong>
            </div>
            <div>
              <small>Model</small>
              <strong>{analysis.model_name ?? 'N/A'}</strong>
            </div>
          </div>

          {analysis.error_message ? (
            <div className="error-box">
              <AlertTriangle size={16} />
              <span>{analysis.error_message}</span>
            </div>
          ) : null}
        </div>

        <div className="glass-card detail-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Metadata</p>
              <h3>Run details</h3>
            </div>
            <Cpu size={16} />
          </div>

          <ul className="meta-list">
            <li><Clock3 size={15} /><span>Created:</span> {analysis.created_at ?? 'N/A'}</li>
            <li><FileImage size={15} /><span>Image URL:</span> {analysis.original_image_url ?? 'Unavailable'}</li>
            <li><ShieldCheck size={15} /><span>Version:</span> {analysis.model_version ?? 'N/A'}</li>
          </ul>
        </div>
      </div>

      {analysis.original_image_url ? (
        <div className="glass-card image-preview">
          <img src={`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}${analysis.original_image_url}`} alt={analysis.original_filename ?? 'Medical scan'} />
        </div>
      ) : null}
    </div>
  )
}
