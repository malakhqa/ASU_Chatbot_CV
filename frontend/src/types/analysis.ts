// Mirrors backend app/schemas/analysis.py.

export interface AnalysisResult {
  score?: number | null
  strengths: string[]
  weaknesses: string[]
  missing: string[]
  recommendations: string[]
}

export interface AnalysisResponse {
  id: number
  cv_id: number | null
  cv_version_number: number | null
  score: number | null
  results: Partial<AnalysisResult>
  recommendations: string[]
  created_at: string
}

export interface AnalyzeRequest {
  cv_id: number
  job_description_id?: number
}
