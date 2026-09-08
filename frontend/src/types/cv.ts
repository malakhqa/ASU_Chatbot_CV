// Mirrors backend app/schemas/cv.py.

import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
} from './profile'

export interface CVPersonalInfo {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedin?: string | null
  github?: string | null
  website?: string | null
}

export interface CVContent {
  personal_info: CVPersonalInfo
  summary: string
  education: EducationItem[]
  experience: ExperienceItem[]
  skills: string[]
  projects: ProjectItem[]
  certifications: CertificationItem[]
  languages: LanguageItem[]
}

export type CVVersionSource =
  'generated' | 'manual_edit' | 'job_customization' | 'chat_edit' | 'restore'

export interface CVVersion {
  id: number
  version_number: number
  source: CVVersionSource
  note: string | null
  content: CVContent
  created_at: string
}

export interface CVSummary {
  id: number
  title: string
  template: string
  current_version_number: number | null
  created_at: string
  updated_at: string
}

export interface CVResponse extends CVSummary {
  current_version: CVVersion | null
}

export interface CVCreateRequest {
  title: string
  template?: string
}

export interface CVUpdateRequest {
  title?: string
  template?: string
  content?: CVContent
  note?: string
}
