const configured = import.meta.env.VITE_API_BASE_URL as string | undefined

export const API_BASE_URL =
  configured !== undefined
    ? configured.replace(/\/$/, '')
    : import.meta.env.PROD
      ? 'https://neurovision-ai-backend.vercel.app'
      : 'http://localhost:8000'