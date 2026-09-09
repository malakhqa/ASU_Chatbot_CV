// Mirrors backend app/schemas/interview.py.

export type QuestionCategory =
  'behavioral' | 'technical' | 'experience' | 'role_specific' | 'motivation'

export interface InterviewQuestion {
  category: QuestionCategory
  question: string
  guidance: string
}

export interface InterviewPrepResult {
  questions: InterviewQuestion[]
  focus_areas: string[]
  tips: string[]
}

export interface InterviewPrepRequest {
  cv_id: number
  job_description_id?: number
}
