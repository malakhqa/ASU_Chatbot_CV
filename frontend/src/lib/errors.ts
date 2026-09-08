import { AxiosError } from 'axios'

interface FastAPIError {
  detail?: string | Array<{ msg?: string }>
}

/** Turns an unknown thrown value (often an AxiosError) into a friendly string. */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as FastAPIError | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
    if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
    return error.message || fallback
  }
  if (error instanceof Error) return error.message || fallback
  return fallback
}
