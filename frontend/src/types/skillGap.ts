// Mirrors backend app/schemas/skill_gap.py.

export interface SkillGapResult {
  match_score: number | null
  have: string[]
  missing: string[]
  improve: string[]
  required: string[]
  summary: string
}

export interface SkillGapRequest {
  cv_id: number
  job_description_id: number
}
