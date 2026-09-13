export type User = {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}

export type AuthResponse = {
  access_token: string
  token_type: string
}

export type AnalysisPrediction = {
  label: string
  confidence: number
}

export type AnalysisListItem = {
  id: string
  original_filename: string
  prediction_label: string | null
  prediction_confidence: number | null
  status: string
  created_at: string
  model_name: string | null
  model_version: string | null
}

export type AnalysisListResponse = {
  items: AnalysisListItem[]
  page: number
  page_size: number
  total: number
}

export type AnalysisDetail = {
  id: string
  status: string
  prediction: AnalysisPrediction | null
  predictions: Array<Record<string, unknown>>
  original_image_url: string | null
  heatmap_url: string | null
  overlay_url: string | null
  model_name: string | null
  model_version: string | null
  processing_time_ms: number | null
  created_at: string | null
  note: string | null
  original_filename: string | null
  stored_image_path: string | null
  error_message: string | null
  patient_id: string | null
  scan_type: string | null
  notes: string | null
}

export type DashboardStats = {
  total_analyses: number
  analyses_this_week: number
  average_confidence: number
  model_version: string
}

export type DashboardActivityItem = {
  date: string
  count: number
}

export type DashboardDistributionItem = {
  label: string
  count: number
}

export type ModelInfo = {
  name: string | null
  version: string | null
  architecture: string | null
  framework: string
  input_size: number[] | null
  classes: string[]
  num_classes: number
  training_dataset: string | null
  validation_metrics: Record<string, unknown>
  model_available: boolean
}

export type HealthStatus = {
  status: string
  service: string
  version: string
}

export type HealthModelStatus = {
  model_available: boolean
  status: string
  message: string
  name: string | null
  version: string | null
}
