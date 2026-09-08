import type { Profile, ProfileUpdate } from '@/types'
import { api } from './api'

export const profileService = {
  async getProfile(): Promise<Profile> {
    const { data } = await api.get<Profile>('/profile')
    return data
  },

  async updateProfile(payload: ProfileUpdate): Promise<Profile> {
    const { data } = await api.put<Profile>('/profile', payload)
    return data
  },
}
