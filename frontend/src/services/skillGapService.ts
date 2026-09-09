import type { SkillGapRequest, SkillGapResult } from '@/types'
import { api } from './api'

export const skillGapService = {
  async analyze(payload: SkillGapRequest): Promise<SkillGapResult> {
    const { data } = await api.post<SkillGapResult>('/cv/skill-gap', payload)
    return data
  },
}
