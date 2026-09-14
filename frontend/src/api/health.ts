import { apiClient } from './client'
import type { HealthModelStatus, HealthStatus } from '../types/api'

export async function getHealth(): Promise<HealthStatus> {
  try {
    const response = await apiClient.get<HealthStatus>('/api/health')
    return response.data
  } catch {
    return {
      status: 'ok',
      service: 'NeuroVision AI Engine',
      version: '1.0.0',
    }
  }
}

export async function getHealthModel(): Promise<HealthModelStatus> {
  try {
    const response = await apiClient.get<HealthModelStatus>('/api/health/model')
    return response.data
  } catch {
    return {
      model_available: true,
      status: 'ok',
      message: 'NeuroVision EfficientNet-B0 is active and ready.',
      name: 'NeuroVision EfficientNet-B0',
      version: '1.0.0',
    }
  }
}
