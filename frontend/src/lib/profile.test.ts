import { describe, expect, it } from 'vitest'

import type { Profile } from '@/types'
import { cleanProfilePayload, emptyProfileFields, isDirty, toFields } from './profile'

const fullProfile: Profile = {
  id: 1,
  user_id: 1,
  created_at: '2026-01-01',
  updated_at: '2026-01-02',
  full_name: 'Jane',
  email: 'jane@example.com',
  phone: null,
  location: null,
  summary: null,
  linkedin: null,
  github: null,
  website: null,
  education: [{ institution: 'ASU' }],
  experience: [],
  skills: ['Python'],
  projects: [],
  certifications: [],
  languages: [{ name: 'English', proficiency: 'Fluent' }],
  awards: [],
}

describe('toFields', () => {
  it('extracts the editable subset', () => {
    const f = toFields(fullProfile)
    expect(f).not.toHaveProperty('id')
    expect(f.full_name).toBe('Jane')
    expect(f.skills).toEqual(['Python'])
    expect(f.awards).toEqual([])
  })
})

describe('cleanProfilePayload', () => {
  it('turns blank scalars into null and trims', () => {
    const f = emptyProfileFields()
    f.full_name = '   '
    f.email = '  jane@example.com  '
    const out = cleanProfilePayload(f)
    expect(out.full_name).toBeNull()
    expect(out.email).toBe('jane@example.com')
  })

  it('drops empty rows and requires key fields', () => {
    const f = emptyProfileFields()
    f.education = [{}, { institution: 'ASU' }]
    f.languages = [{ name: '' }, { name: 'Arabic' }]
    f.awards = [{ title: '  ' }, { title: 'Deans List' }]
    f.experience = [{ highlights: [] }, { title: 'Intern' }]
    const out = cleanProfilePayload(f)
    expect(out.education).toEqual([{ institution: 'ASU' }])
    expect(out.languages).toEqual([{ name: 'Arabic' }])
    expect(out.awards).toEqual([{ title: 'Deans List' }])
    expect(out.experience).toHaveLength(1)
  })

  it('trims string lists', () => {
    const f = emptyProfileFields()
    f.skills = [' Python ', '', 'SQL', 'Python']
    f.projects = [{ name: 'P', technologies: [' Go ', ''] }]
    const out = cleanProfilePayload(f)
    expect(out.skills).toEqual(['Python', 'SQL', 'Python'])
    expect(out.projects[0].technologies).toEqual(['Go'])
  })
})

describe('isDirty', () => {
  it('compares field snapshots', () => {
    const a = toFields(fullProfile)
    const b = toFields(fullProfile)
    expect(isDirty(a, b)).toBe(false)
    b.full_name = 'Changed'
    expect(isDirty(a, b)).toBe(true)
  })
})
