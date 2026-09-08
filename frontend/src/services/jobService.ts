import type { CustomizeRequest, CVResponse, JobDescription, JobDescriptionCreate } from '@/types'
import { api } from './api'

export const jobService = {
  async list(): Promise<JobDescription[]> {
    const { data } = await api.get<JobDescription[]>('/jobs')
    return data
  },

  async create(payload: JobDescriptionCreate): Promise<JobDescription> {
    const { data } = await api.post<JobDescription>('/jobs', payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/jobs/${id}`)
  },

  async customize(payload: CustomizeRequest): Promise<CVResponse> {
    const { data } = await api.post<CVResponse>('/jobs/customize', payload)
    return data
  },
}
