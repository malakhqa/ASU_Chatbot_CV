// Mirrors backend app/schemas/profile.py. Dates are free-form strings.

export interface EducationItem {
  institution?: string
  degree?: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  gpa?: string
  description?: string
}

export interface ExperienceItem {
  title?: string
  company?: string
  location?: string
  start_date?: string
  end_date?: string
  current?: boolean
  description?: string
  highlights?: string[]
}

export interface ProjectItem {
  name?: string
  description?: string
  technologies?: string[]
  link?: string
  highlights?: string[]
}

export interface CertificationItem {
  name?: string
  issuer?: string
  issue_date?: string
  credential_id?: string
  link?: string
}

export interface LanguageItem {
  name: string
  proficiency?: string
}

export interface AwardItem {
  title: string
  issuer?: string
  date?: string
  description?: string
}

/** The editable part of a profile (also the PUT payload). */
export interface ProfileFields {
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  linkedin: string | null
  github: string | null
  website: string | null
  education: EducationItem[]
  experience: ExperienceItem[]
  skills: string[]
  projects: ProjectItem[]
  certifications: CertificationItem[]
  languages: LanguageItem[]
  awards: AwardItem[]
}

export type ProfileUpdate = ProfileFields

export interface Profile extends ProfileFields {
  id: number
  user_id: number
  created_at: string
  updated_at: string
}
