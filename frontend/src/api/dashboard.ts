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
    return response.data
  } catch {
    return getLocalDashboardStats()
  }
}

export async function getDashboardActivity(): Promise<DashboardActivityItem[]> {
  try {
    const response = await apiClient.get<DashboardActivityItem[]>('/api/dashboard/activity')
    return response.data
  } catch {
    return getLocalDashboardActivity()
  }
}

export async function getDashboardDistribution(): Promise<DashboardDistributionItem[]> {
  try {
    const response = await apiClient.get<DashboardDistributionItem[]>('/api/dashboard/distribution')
    return response.data
  } catch {
    return getLocalDashboardDistribution()
  }
}
