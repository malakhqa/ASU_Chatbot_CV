import type { CVCreateRequest, CVResponse, CVSummary, CVUpdateRequest, CVVersion } from '@/types'
import { filenameFromDisposition } from '@/lib/download'
import { api } from './api'

export const cvService = {
  async list(): Promise<CVSummary[]> {
    const { data } = await api.get<CVSummary[]>('/cv')
    return data
  },

  async get(id: number): Promise<CVResponse> {
    const { data } = await api.get<CVResponse>(`/cv/${id}`)
    return data
  },

  async create(payload: CVCreateRequest): Promise<CVResponse> {
    const { data } = await api.post<CVResponse>('/cv', payload)
    return data
  },

  async generate(payload: CVCreateRequest): Promise<CVResponse> {
    const { data } = await api.post<CVResponse>('/cv/generate', payload)
    return data
  },

  async update(id: number, payload: CVUpdateRequest): Promise<CVResponse> {
    const { data } = await api.put<CVResponse>(`/cv/${id}`, payload)
    return data
  },

  async listVersions(id: number): Promise<CVVersion[]> {
    const { data } = await api.get<CVVersion[]>(`/cv/${id}/versions`)
    return data
  },

  async restoreVersion(id: number, versionNumber: number): Promise<CVResponse> {
    const { data } = await api.post<CVResponse>(`/cv/${id}/versions/${versionNumber}/restore`)
    return data
  },

  async downloadPdf(id: number, fallbackName: string): Promise<{ blob: Blob; filename: string }> {
    const res = await api.get<Blob>(`/cv/${id}/pdf`, { responseType: 'blob' })
    const disposition = res.headers['content-disposition'] as string | undefined
    return { blob: res.data, filename: filenameFromDisposition(disposition, fallbackName) }
  },
}
