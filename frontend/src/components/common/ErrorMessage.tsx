import { toErrorMessage } from '@/lib/errors'

export interface ErrorMessageProps {
  error: unknown
  fallback?: string
}

export function ErrorMessage({ error, fallback }: ErrorMessageProps) {
  if (!error) return null
  return (
    <p className="error-message" role="alert">
      {toErrorMessage(error, fallback)}
    </p>
  )
}
