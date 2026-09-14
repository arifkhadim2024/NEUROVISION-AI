const configured = import.meta.env.VITE_API_BASE_URL as string | undefined

export const API_BASE_URL =
  configured !== undefined && configured.trim() !== ''
    ? configured.replace(/\/$/, '')
    : import.meta.env.PROD
      ? ''
      : 'http://localhost:8000'