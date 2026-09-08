// Mirrors backend app/schemas/job.py.

export interface JobDescription {
  id: number
  title: string
  company: string | null
  description: string
  created_at: string
}

export interface JobDescriptionCreate {
  title: string
  company?: string | null
  description: string
}

export interface CustomizeRequest {
  cv_id: number
  job_description_id?: number
  job_description?: JobDescriptionCreate
}
