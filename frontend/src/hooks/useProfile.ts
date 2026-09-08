import { useCallback, useEffect, useState } from 'react'

import { profileService } from '@/services/profileService'
import type { Profile } from '@/types'

type Status = 'loading' | 'ready' | 'error'

export interface UseProfile {
  profile: Profile | null
  status: Status
  error: unknown
  reload: () => void
  setProfile: (p: Profile) => void
}

export function useProfile(): UseProfile {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<unknown>(null)

  const reload = useCallback(() => {
    setStatus('loading')
    setError(null)
    profileService
      .getProfile()
      .then((p) => {
        setProfile(p)
        setStatus('ready')
      })
      .catch((e) => {
        setError(e)
        setStatus('error')
      })
  }, [])

  useEffect(reload, [reload])

  return { profile, status, error, reload, setProfile }
}
