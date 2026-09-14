import axios from 'axios'

import { API_BASE_URL } from '../config'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('neurovision_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('neurovision_token')
      if (typeof window !== 'undefined') {
        const path = window.location.pathname
        if (path !== '/login' && path !== '/register' && path !== '/') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)
