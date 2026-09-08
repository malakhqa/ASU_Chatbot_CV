import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { profileService } from '@/services/profileService'
import type { Profile } from '@/types'
import ProfilePage from './Profile'

vi.mock('@/services/profileService', () => ({
  profileService: { getProfile: vi.fn(), updateProfile: vi.fn() },
}))

const getProfile = vi.mocked(profileService.getProfile)
const updateProfile = vi.mocked(profileService.updateProfile)

const emptyProfile: Profile = {
  id: 1,
  user_id: 1,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
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

beforeEach(() => {
  getProfile.mockReset()
  updateProfile.mockReset()
})
afterEach(() => vi.clearAllMocks())

// The page renders a Save button in the header and the footer.
const saveButton = () => screen.getAllByRole('button', { name: /save changes/i })[0]

describe('<Profile />', () => {
  it('loads and shows the form', async () => {
    getProfile.mockResolvedValue({ ...emptyProfile, full_name: 'Jane Doe' })
    render(<ProfilePage />)
    expect(await screen.findByRole('heading', { name: /career profile/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveValue('Jane Doe')
  })

  it('disables Save until something changes, then saves a cleaned payload', async () => {
    getProfile.mockResolvedValue(emptyProfile)
    updateProfile.mockImplementation(async (payload) => ({ ...emptyProfile, ...payload }))
    const user = userEvent.setup()
    render(<ProfilePage />)

    await screen.findByRole('heading', { name: /career profile/i })
    expect(saveButton()).toBeDisabled()

    await user.type(screen.getByLabelText('Full name'), '  Jane  ')
    expect(saveButton()).toBeEnabled()

    await user.click(saveButton())
    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1))
    expect(updateProfile.mock.calls[0][0].full_name).toBe('Jane') // trimmed
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('blocks saving on an invalid email', async () => {
    getProfile.mockResolvedValue(emptyProfile)
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.type(await screen.findByLabelText('Email'), 'not-an-email')
    expect(saveButton()).toBeDisabled()
    expect(screen.getAllByText(/valid email address/i).length).toBeGreaterThan(0)
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('surfaces a server error on save', async () => {
    getProfile.mockResolvedValue(emptyProfile)
    const err = new AxiosError('Request failed')
    err.response = { status: 422, data: { detail: 'bad payload' } } as AxiosError['response']
    updateProfile.mockRejectedValue(err)
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.type(await screen.findByLabelText('Full name'), 'Jane')
    await user.click(saveButton())
    expect(await screen.findByText('bad payload')).toBeInTheDocument()
  })

  it('adds an experience row via the repeatable list', async () => {
    getProfile.mockResolvedValue(emptyProfile)
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(await screen.findByRole('button', { name: /add experience/i }))
    const region = screen.getByRole('region', { name: /experience/i })
    expect(within(region).getByLabelText('Title')).toBeInTheDocument()
  })
})
