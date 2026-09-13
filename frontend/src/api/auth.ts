import { apiClient } from './client'
import type { AuthResponse, User } from '../types/api'

export async function registerUser(data: { full_name: string; email: string; password: string }) {
  const response = await apiClient.post<User>('/api/auth/register', data)
  return response.data
}

export async function loginUser(data: { email: string; password: string }) {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', data)
  return response.data
}

export async function getCurrentUser() {
  const response = await apiClient.get<User>('/api/auth/me')
  return response.data
}
