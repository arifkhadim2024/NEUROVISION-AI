import { apiClient } from './client'
import type { DashboardActivityItem, DashboardDistributionItem, DashboardStats } from '../types/api'

export async function getDashboardStats() {
  const response = await apiClient.get<DashboardStats>('/api/dashboard/stats')
  return response.data
}

export async function getDashboardActivity() {
  const response = await apiClient.get<DashboardActivityItem[]>('/api/dashboard/activity')
  return response.data
}

export async function getDashboardDistribution() {
  const response = await apiClient.get<DashboardDistributionItem[]>('/api/dashboard/distribution')
  return response.data
}
