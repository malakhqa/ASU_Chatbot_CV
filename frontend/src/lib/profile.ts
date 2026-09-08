import type { Profile, ProfileFields, ProfileUpdate } from '@/types'

const SCALAR_KEYS = [
  'full_name',
  'email',
  'phone',
  'location',
  'summary',
  'linkedin',
  'github',
  'website',
] as const

export function emptyProfileFields(): ProfileFields {
  return {
    full_name: null,
    email: null,
    phone: null,
    location: null,
    summary: null,
    linkedin: null,
    github: null,
    website: null,
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    awards: [],
  }
}

/** Extract the editable subset from a Profile response. */
export function toFields(profile: Profile): ProfileFields {
  const base = emptyProfileFields()
  return {
    ...base,
    full_name: profile.full_name ?? null,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    location: profile.location ?? null,
    summary: profile.summary ?? null,
    linkedin: profile.linkedin ?? null,
    github: profile.github ?? null,
    website: profile.website ?? null,
    education: [...(profile.education ?? [])],
    experience: [...(profile.experience ?? [])],
    skills: [...(profile.skills ?? [])],
    projects: [...(profile.projects ?? [])],
    certifications: [...(profile.certifications ?? [])],
    languages: [...(profile.languages ?? [])],
    awards: [...(profile.awards ?? [])],
  }
}

const trimList = (xs?: string[]): string[] => (xs ?? []).map((x) => x.trim()).filter(Boolean)

const someValue = (obj: object): boolean =>
  Object.values(obj).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v)))

/**
 * Prepare the payload for PUT /api/profile:
 * blank scalars -> null, string lists trimmed, and section rows that are
 * entirely empty (or missing their required key) are dropped so the backend
 * doesn't 422 on placeholder rows.
 */
export function cleanProfilePayload(fields: ProfileFields): ProfileUpdate {
  const out = emptyProfileFields()

  for (const key of SCALAR_KEYS) {
    const value = fields[key]
    out[key] = value && value.trim() ? value.trim() : null
  }

  out.skills = trimList(fields.skills)

  out.education = (fields.education ?? []).filter((e) => someValue(e))
  out.certifications = (fields.certifications ?? []).filter((c) => someValue(c))

  out.experience = (fields.experience ?? [])
    .map((e) => ({ ...e, highlights: trimList(e.highlights) }))
    .filter((e) => e.title || e.company || e.description || e.highlights?.length)

  out.projects = (fields.projects ?? [])
    .map((p) => ({
      ...p,
      technologies: trimList(p.technologies),
      highlights: trimList(p.highlights),
    }))
    .filter((p) => p.name || p.description || p.technologies?.length)

  out.languages = (fields.languages ?? []).filter((l) => l.name?.trim())
  out.awards = (fields.awards ?? []).filter((a) => a.title?.trim())

  return out
}

export function isDirty(a: ProfileFields, b: ProfileFields): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}
