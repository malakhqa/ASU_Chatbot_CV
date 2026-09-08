import { useCallback, useEffect, useState } from 'react'

import { cvService } from '@/services/cvService'
import type { CVResponse } from '@/types'

type Status = 'loading' | 'ready' | 'error'

export interface UseCV {
  cv: CVResponse | null
  status: Status
  error: unknown
  reload: () => void
  setCv: (cv: CVResponse) => void
}

export function useCV(id: number): UseCV {
  const [cv, setCv] = useState<CVResponse | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<unknown>(null)

  const reload = useCallback(() => {
    setStatus('loading')
    setError(null)
    cvService
      .get(id)
      .then((c) => {
        setCv(c)
        setStatus('ready')
      })
      .catch((e) => {
        setError(e)
        setStatus('error')
      })
  }, [id])

  useEffect(reload, [reload])

  return { cv, status, error, reload, setCv }
}
