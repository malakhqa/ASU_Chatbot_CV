import type { ATSCheckRequest, ATSResult } from '@/types'
import { api } from './api'

export const atsService = {
  async check(payload: ATSCheckRequest): Promise<ATSResult> {
    const { data } = await api.post<ATSResult>('/cv/ats-check', payload)
    return data
  },
}
