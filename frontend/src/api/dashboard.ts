import { apiClient } from './client'
import type { DashboardActivityItem, DashboardDistributionItem, DashboardStats } from '../types/api'
import {
  getLocalDashboardActivity,
  getLocalDashboardDistribution,
  getLocalDashboardStats,
} from '../utils/localAnalysis'

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await apiClient.get<DashboardStats>('/api/dashboard/stats')
    if (
      response.data &&
      typeof response.data === 'object' &&
      typeof response.data.total_analyses === 'number'
    ) {
      return response.data
    }
    return getLocalDashboardStats()
  } catch {
    return getLocalDashboardStats()
  }
}

export async function getDashboardActivity(): Promise<DashboardActivityItem[]> {
  try {
    const response = await apiClient.get<DashboardActivityItem[]>('/api/dashboard/activity')
    if (Array.isArray(response.data)) {
      return response.data
    }
    return getLocalDashboardActivity()
  } catch {
    return getLocalDashboardActivity()
  }
}

export async function getDashboardDistribution(): Promise<DashboardDistributionItem[]> {
  try {
    const response = await apiClient.get<DashboardDistributionItem[]>('/api/dashboard/distribution')
    if (Array.isArray(response.data)) {
      return response.data
    }
    return getLocalDashboardDistribution()
  } catch {
    return getLocalDashboardDistribution()
  }
}
