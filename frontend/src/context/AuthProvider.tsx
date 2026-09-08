import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { setAuthFailureHandler } from '@/services/api'
import { authService } from '@/services/authService'
import { clearTokens, getTokens, setTokens } from '@/services/tokenStore'
import type { Credentials, RegisterPayload, User } from '@/types'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setStatus('anonymous')
  }, [])

  // Let the axios layer drop us to anonymous when a refresh ultimately fails.
  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null)
      setStatus('anonymous')
    })
  }, [])

  // Restore the session on first load.
  useEffect(() => {
    const { access } = getTokens()
    if (!access) {
      setStatus('anonymous')
      return
    }
    authService
      .me()
      .then((restored) => {
        setUser(restored)
        setStatus('authenticated')
      })
      .catch(() => {
        clearTokens()
        setStatus('anonymous')
      })
  }, [])

  const finishAuth = useCallback(
    async (tokens: { access_token: string; refresh_token: string }) => {
      setTokens({ access: tokens.access_token, refresh: tokens.refresh_token })
      setUser(await authService.me())
      setStatus('authenticated')
    },
    [],
  )

  const login = useCallback(
    async (credentials: Credentials) => finishAuth(await authService.login(credentials)),
    [finishAuth],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => finishAuth(await authService.register(payload)),
    [finishAuth],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
