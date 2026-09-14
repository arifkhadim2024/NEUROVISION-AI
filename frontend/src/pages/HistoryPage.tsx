import { useQuery } from '@tanstack/react-query'
import { Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { listAnalyses } from '../api/analyses'

export function HistoryPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const historyQuery = useQuery({
    queryKey: ['history', page, search],
    queryFn: async () => listAnalyses({ page, page_size: 10, search: search || undefined }),
  })

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">History</p>
          <h2>Analysis records</h2>
        </div>
      </div>

      <div className="glass-card form-card history-toolbar">
        <div className="input-wrap search-wrap">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search analyses" />
        </div>
      </div>

      {historyQuery.isLoading ? <div className="page-panel"><p>Loading history...</p></div> : null}
      {historyQuery.isError ? <div className="page-panel"><p>Unable to load history.</p></div> : null}

      {!historyQuery.isLoading && !historyQuery.isError && historyQuery.data ? (
        Array.isArray(historyQuery.data.items) && historyQuery.data.items.length > 0 ? (
          <div className="history-list">
            {historyQuery.data.items.map((analysis) => (
              <Link key={analysis.id} to={`/app/analysis/${analysis.id}`} className="glass-card history-item">
                <div>
                  <p className="eyebrow">{analysis.status}</p>
                  <h3>{analysis.original_filename}</h3>
                  <small>{new Date(analysis.created_at).toLocaleString()}</small>
                </div>
                <div className="history-meta">
                  <span>{analysis.prediction_label ?? 'Pending'}</span>
                  <ShieldCheck size={16} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="page-panel"><p>No analyses found.</p></div>
        )
      ) : null}

      {!historyQuery.isLoading && historyQuery.data && historyQuery.data.total > 10 ? (
        <div className="pager">
          <button type="button" className="button button-secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            Previous
          </button>
          <span>Page {page}</span>
          <button type="button" className="button button-secondary" disabled={page * 10 >= historyQuery.data.total} onClick={() => setPage((current) => current + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
