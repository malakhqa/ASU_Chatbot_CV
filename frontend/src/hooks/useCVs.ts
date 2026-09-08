import { useCallback, useEffect, useState } from 'react'

import { cvService } from '@/services/cvService'
import type { CVSummary } from '@/types'

type Status = 'loading' | 'ready' | 'error'

export interface UseCVs {
  cvs: CVSummary[]
  status: Status
  error: unknown
  reload: () => void
}

export function useCVs(): UseCVs {
  const [cvs, setCvs] = useState<CVSummary[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<unknown>(null)

  const reload = useCallback(() => {
    setStatus('loading')
    setError(null)
    cvService
      .list()
      .then((list) => {
        setCvs(list)
        setStatus('ready')
      })
      .catch((e) => {
        setError(e)
        setStatus('error')
      })
  }, [])

  useEffect(reload, [reload])

  return { cvs, status, error, reload }
}
