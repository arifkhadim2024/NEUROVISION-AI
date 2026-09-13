import { apiClient } from './client'
import type { HealthModelStatus, HealthStatus } from '../types/api'

export async function getHealth() {
  const response = await apiClient.get<HealthStatus>('/api/health')
  return response.data
}

export async function getHealthModel() {
  const response = await apiClient.get<HealthModelStatus>('/api/health/model')
  return response.data
}
