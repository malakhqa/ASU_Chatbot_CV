import type { InterviewPrepRequest, InterviewPrepResult } from '@/types'
import { api } from './api'

export const interviewService = {
  async prepare(payload: InterviewPrepRequest): Promise<InterviewPrepResult> {
    const { data } = await api.post<InterviewPrepResult>('/cv/interview-prep', payload)
    return data
  },
}
