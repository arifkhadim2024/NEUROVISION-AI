import { useState, type FormEvent } from 'react'
import { ImagePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { createAnalysis } from '../api/analyses'

export function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [patientId, setPatientId] = useState('')
  const [scanType, setScanType] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setError('Please choose an image before uploading.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const form = new FormData()
      form.append('file', file)
      if (patientId) form.append('patient_id', patientId)
      if (scanType) form.append('scan_type', scanType)
      if (notes) form.append('notes', notes)

      const result = await createAnalysis(form)
      navigate(`/app/analysis/${result.id}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-shell narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">New upload</p>
          <h2>Analyze medical image</h2>
        </div>
      </div>

      <form className="glass-card form-card" onSubmit={handleSubmit}>
        <label className="field">
          <span>Image file</span>
          <div className="dropzone">
            <ImagePlus size={18} />
            <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          {file ? <small>{file.name}</small> : <small>No file selected</small>}
        </label>

        <div className="two-column">
          <label className="field">
            <span>Patient ID</span>
            <input type="text" value={patientId} onChange={(event) => setPatientId(event.target.value)} placeholder="PT-10042" />
          </label>
          <label className="field">
            <span>Scan type</span>
            <input type="text" value={scanType} onChange={(event) => setScanType(event.target.value)} placeholder="MRI / CT / X-ray" />
          </label>
        </div>

        <label className="field">
          <span>Clinical notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="Optional context for the analysis payload" />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button button-primary wide" type="submit" disabled={uploading}>
          {uploading ? 'Processing...' : 'Run analysis'}
        </button>
      </form>
    </div>
  )
}
