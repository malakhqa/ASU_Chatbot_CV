import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { API_BASE_URL } from '@/config'
import { clearTokens, getTokens, setTokens } from './tokenStore'

/** Shared axios instance. Base URL includes the `/api` prefix. */
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// --- attach the access token to every request ---
api.interceptors.request.use((config) => {
  const { access } = getTokens()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// --- on 401, try a single refresh and replay the request ---
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let inFlightRefresh: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens()
  if (!refresh) return null
  try {
    const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
      `${API_BASE_URL}/api/auth/refresh`,
      { refresh_token: refresh },
    )
    setTokens({ access: data.access_token, refresh: data.refresh_token })
    return data.access_token
  } catch {
    clearTokens()
    return null
  }
}

type AuthFailureHandler = () => void
let authFailureHandler: AuthFailureHandler = () => {}

/** Called (e.g. by AuthProvider) when the session can no longer be recovered. */
export function setAuthFailureHandler(handler: AuthFailureHandler): void {
  authFailureHandler = handler
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthCall = original?.url?.includes('/auth/')

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      inFlightRefresh ??= refreshAccessToken().finally(() => {
        inFlightRefresh = null
      })
      const newAccess = await inFlightRefresh
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      }
      clearTokens()
      authFailureHandler()
    }

    return Promise.reject(error)
  },
)
