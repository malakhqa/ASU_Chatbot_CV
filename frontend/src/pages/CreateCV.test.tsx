import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cvService } from '@/services/cvService'
import type { CVResponse } from '@/types'
import CreateCV from './CreateCV'

vi.mock('@/services/cvService', () => ({
  cvService: { create: vi.fn(), generate: vi.fn() },
}))
const create = vi.mocked(cvService.create)
const generate = vi.mocked(cvService.generate)

beforeEach(() => {
  create.mockReset()
  generate.mockReset()
})

function setup() {
  return render(
    <MemoryRouter initialEntries={['/cvs/new']}>
      <Routes>
        <Route path="/cvs/new" element={<CreateCV />} />
        <Route path="/cvs/:id" element={<div>CV DETAIL</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const cvResponse = (id: number): CVResponse => ({
  id,
  title: 'x',
  template: 'professional',
  current_version_number: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  current_version: null,
})

describe('<CreateCV />', () => {
  it('requires a title', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /generate from my profile/i }))
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
    expect(generate).not.toHaveBeenCalled()
  })

  it('generates from the profile and navigates to the new CV', async () => {
    generate.mockResolvedValue(cvResponse(42))
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText('Title'), 'Backend CV')
    await user.selectOptions(screen.getByLabelText('Template'), 'modern')
    await user.click(screen.getByRole('button', { name: /generate from my profile/i }))

    expect(await screen.findByText('CV DETAIL')).toBeInTheDocument()
    expect(generate).toHaveBeenCalledWith({ title: 'Backend CV', template: 'modern' })
  })

  it('creates a blank CV', async () => {
    create.mockResolvedValue(cvResponse(7))
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText('Title'), 'Blank CV')
    await user.click(screen.getByRole('button', { name: /start blank/i }))

    expect(await screen.findByText('CV DETAIL')).toBeInTheDocument()
    expect(create).toHaveBeenCalledWith({ title: 'Blank CV', template: 'professional' })
  })

  it('surfaces a 503 when AI is not configured', async () => {
    const err = new AxiosError('Request failed')
    err.response = {
      status: 503,
      data: { detail: 'AI service is not configured' },
    } as AxiosError['response']
    generate.mockRejectedValue(err)
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText('Title'), 'Backend CV')
    await user.click(screen.getByRole('button', { name: /generate from my profile/i }))
    expect(await screen.findByText(/ai service is not configured/i)).toBeInTheDocument()
  })
})
