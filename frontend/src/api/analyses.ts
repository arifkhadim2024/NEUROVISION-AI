import { apiClient } from './client'
import type { AnalysisDetail, AnalysisListResponse } from '../types/api'
import {
  deleteLocalAnalysis,
  getLocalAnalyses,
  getLocalAnalysisDetailAsync,
  processLocalScan,
} from '../utils/localAnalysis'

export async function createAnalysis(formData: FormData): Promise<AnalysisDetail> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('neurovision_token') : null

  // If running in demo mode, execute client-side XAI pipeline directly
  if (!token || token === 'demo-token') {
    const file = formData.get('file') as File | null
    if (!file) throw new Error('No file provided')
    const patientId = (formData.get('patient_id') as string) || undefined
    const scanType = (formData.get('scan_type') as string) || undefined
    const notes = (formData.get('notes') as string) || undefined
    return await processLocalScan(file, patientId, scanType, notes)
  }

  try {
    const response = await apiClient.post<AnalysisDetail>('/api/analyses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch {
    const file = formData.get('file') as File | null
    if (!file) throw new Error('Upload failed')
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
  const local = getLocalAnalyses()
  const page = params?.page || 1
  const pageSize = params?.page_size || 10
  const token = typeof window !== 'undefined' ? localStorage.getItem('neurovision_token') : null

  if (!token || token === 'demo-token') {
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

  try {
    const response = await apiClient.get<AnalysisListResponse>('/api/analyses', { params })
    const remoteItems = response.data.items || []
    const remoteIds = new Set(remoteItems.map((i) => i.id))
    const localItems = local
      .filter((l) => !remoteIds.has(l.id))
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
      items: [...localItems, ...remoteItems],
      page,
      page_size: pageSize,
      total: response.data.total + localItems.length,
    }
  } catch {
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
  // If it's a local scan ID, resolve instantly from memory / IndexedDB
  if (analysisId.startsWith('scan-')) {
    const local = await getLocalAnalysisDetailAsync(analysisId)
    if (local) return local
  }

  try {
    const response = await apiClient.get<AnalysisDetail>(`/api/analyses/${analysisId}`)
    return response.data
  } catch {
    const local = await getLocalAnalysisDetailAsync(analysisId)
    if (local) return local
    throw new Error('Analysis not found')
  }
}

export async function deleteAnalysis(analysisId: string): Promise<void> {
  deleteLocalAnalysis(analysisId)
  if (!analysisId.startsWith('scan-')) {
    try {
      await apiClient.delete(`/api/analyses/${analysisId}`)
    } catch {
      // ignore
    }
  }
}
