import type { Credentials, RegisterPayload, TokenResponse, User } from '@/types'
import { api } from './api'

export const authService = {
  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/register', payload)
    return data
  },

  async login(credentials: Credentials): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/login', credentials)
    return data
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}
