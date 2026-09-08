import type { AnalysisResponse, AnalyzeRequest } from '@/types'
import { api } from './api'

export const analysisService = {
  async analyze(payload: AnalyzeRequest): Promise<AnalysisResponse> {
    const { data } = await api.post<AnalysisResponse>('/cv/analyze', payload)
    return data
  },

  async listForCv(cvId: number): Promise<AnalysisResponse[]> {
    const { data } = await api.get<AnalysisResponse[]>(`/cv/${cvId}/analyses`)
    return data
  },
}
