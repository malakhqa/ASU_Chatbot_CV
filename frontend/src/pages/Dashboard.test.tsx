import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { emptyProfileFields } from '@/lib/profile'
import { cvService } from '@/services/cvService'
import { profileService } from '@/services/profileService'
import type { CVSummary, Profile } from '@/types'

import Dashboard from './Dashboard'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { email: 'me@example.com' } }),
}))
vi.mock('@/services/profileService', () => ({
  profileService: { getProfile: vi.fn() },
}))
vi.mock('@/services/cvService', () => ({
  cvService: { list: vi.fn() },
}))

const getProfile = vi.mocked(profileService.getProfile)
const listCvs = vi.mocked(cvService.list)

const profile = (over: Partial<Profile> = {}): Profile => ({
  ...emptyProfileFields(),
  id: 1,
  user_id: 1,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  ...over,
})

const cv = (id: number, title: string): CVSummary => ({
  id,
  title,
  template: 'professional',
  current_version_number: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
})

beforeEach(() => {
  getProfile.mockReset()
  listCvs.mockReset()
})

function setup() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
}

describe('<Dashboard />', () => {
  it('greets by name and shows profile completeness + CVs', async () => {
    getProfile.mockResolvedValue(
      profile({ full_name: 'Jane Doe', email: 'jane@example.com', skills: ['Python'] }),
    )
    listCvs.mockResolvedValue([cv(1, 'Backend CV'), cv(2, 'Data CV')])
    setup()

    expect(await screen.findByRole('heading', { name: /welcome, jane doe/i })).toBeInTheDocument()
    expect(screen.getByText(/3 of 7/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Backend CV' })).toHaveAttribute('href', '/cvs/1')
    expect(screen.getByRole('link', { name: /create a cv/i })).toHaveAttribute('href', '/cvs/new')
  })

  it('falls back to the email and shows the empty CV state', async () => {
    getProfile.mockResolvedValue(profile())
    listCvs.mockResolvedValue([])
    setup()

    expect(
      await screen.findByRole('heading', { name: /welcome, me@example.com/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/0 of 7/)).toBeInTheDocument()
    expect(screen.getByText(/no cvs yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /complete profile/i })).toHaveAttribute(
      'href',
      '/profile',
    )
  })
})
