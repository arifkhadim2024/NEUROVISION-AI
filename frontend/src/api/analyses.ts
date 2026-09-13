import { apiClient } from './client'
import type { AnalysisDetail, AnalysisListResponse } from '../types/api'

export async function createAnalysis(formData: FormData) {
  const response = await apiClient.post<AnalysisDetail>('/api/analyses', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function listAnalyses(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: string
  prediction?: string
  sort?: string
}) {
  const response = await apiClient.get<AnalysisListResponse>('/api/analyses', { params })
  return response.data
}

export async function getAnalysisById(analysisId: string) {
  const response = await apiClient.get<AnalysisDetail>(`/api/analyses/${analysisId}`)
  return response.data
}

export async function deleteAnalysis(analysisId: string) {
  await apiClient.delete(`/api/analyses/${analysisId}`)
}
