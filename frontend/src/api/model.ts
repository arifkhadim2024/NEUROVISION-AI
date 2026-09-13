import { apiClient } from './client'
import type { ModelInfo } from '../types/api'

export async function getModelInfo() {
  const response = await apiClient.get<ModelInfo>('/api/model/info')
  return response.data
}
