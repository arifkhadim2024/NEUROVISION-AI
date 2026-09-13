import { useQuery } from '@tanstack/react-query'

import { getModelInfo } from '../api/model'

export function ModelPage() {
  const modelQuery = useQuery({
    queryKey: ['model-info'],
    queryFn: getModelInfo,
  })

  if (modelQuery.isLoading) {
    return <div className="page-panel"><p>Loading model metadata...</p></div>
  }

  if (modelQuery.isError || !modelQuery.data) {
    return <div className="page-panel"><p>Unable to load model information.</p></div>
  }

  const model = modelQuery.data

  return (
    <div className="page-shell narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Model</p>
          <h2>Model information</h2>
        </div>
      </div>

      <div className="glass-card form-card">
        <div className="detail-metrics">
          <div>
            <small>Name</small>
            <strong>{model.name ?? 'N/A'}</strong>
          </div>
          <div>
            <small>Version</small>
            <strong>{model.version ?? 'N/A'}</strong>
          </div>
          <div>
            <small>Available</small>
            <strong>{model.model_available ? 'Yes' : 'No'}</strong>
          </div>
        </div>

        <ul className="meta-list">
          <li><span>Architecture:</span> {model.architecture ?? 'N/A'}</li>
          <li><span>Framework:</span> {model.framework ?? 'N/A'}</li>
          <li><span>Input size:</span> {model.input_size ? model.input_size.join(' × ') : 'N/A'}</li>
          <li><span>Classes:</span> {model.classes.length ? model.classes.join(', ') : 'N/A'}</li>
          <li><span>Num classes:</span> {model.num_classes}</li>
          <li><span>Dataset:</span> {model.training_dataset ?? 'N/A'}</li>
        </ul>
      </div>
    </div>
  )
}
