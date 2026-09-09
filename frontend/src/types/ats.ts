// Mirrors backend app/schemas/ats.py.

export type ATSCategory = 'keywords' | 'sections' | 'formatting' | 'relevance' | 'content'
export type ATSSeverity = 'high' | 'medium' | 'low'

export interface ATSFinding {
  category: ATSCategory
  severity: ATSSeverity
  message: string
}

export interface ATSResult {
  score: number | null
  passed: string[]
  findings: ATSFinding[]
  recommendations: string[]
}

export interface ATSCheckRequest {
  cv_id: number
  job_description_id?: number
}
