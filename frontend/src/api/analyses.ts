import { apiClient } from './client'
import type { AnalysisDetail, AnalysisListResponse } from '../types/api'
import {
  deleteLocalAnalysis,
  getLocalAnalyses,
  getLocalAnalysisById,
  processLocalScan,
} from '../utils/localAnalysis'

export async function createAnalysis(formData: FormData): Promise<AnalysisDetail> {
  try {
    const response = await apiClient.post<AnalysisDetail>('/api/analyses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    const file = formData.get('file') as File | null
    if (!file) throw error

    const patientId = (formData.get('patient_id') as string) || undefined
    const scanType = (formData.get('scan_type') as string) || undefined
    const notes = (formData.get('notes') as string) || undefined

    return await processLocalScan(file, patientId, scanType, notes)
  }
}

export async function listAnalyses(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: string
  prediction?: string
  sort?: string
}): Promise<AnalysisListResponse> {
  try {
    const response = await apiClient.get<AnalysisListResponse>('/api/analyses', { params })
    return response.data
  } catch {
    const local = getLocalAnalyses()
    const page = params?.page || 1
    const pageSize = params?.page_size || 10

    let filtered = local
    if (params?.search) {
      const q = params.search.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.original_filename?.toLowerCase().includes(q) ||
          item.prediction?.label?.toLowerCase().includes(q) ||
          item.patient_id?.toLowerCase().includes(q),
      )
    }

    const items = filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map((item) => ({
        id: item.id,
        original_filename: item.original_filename || 'scan.jpg',
        prediction_label: item.prediction?.label || null,
        prediction_confidence: item.prediction?.confidence || null,
        status: item.status,
        created_at: item.created_at || new Date().toISOString(),
        model_name: item.model_name,
        model_version: item.model_version,
      }))

    return {
      items,
      page,
      page_size: pageSize,
      total: filtered.length,
    }
  }
}

export async function getAnalysisById(analysisId: string): Promise<AnalysisDetail> {
  try {
    const response = await apiClient.get<AnalysisDetail>(`/api/analyses/${analysisId}`)
    return response.data
  } catch {
    const local = getLocalAnalysisById(analysisId)
    if (local) return local
    throw new Error('Analysis not found')
  }
}

export async function deleteAnalysis(analysisId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/analyses/${analysisId}`)
  } catch {
    // delete local
  }
  deleteLocalAnalysis(analysisId)
}
