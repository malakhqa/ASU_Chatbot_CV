import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cvService } from '@/services/cvService'
import type { CVSummary } from '@/types'
import MyCVs from './MyCVs'

vi.mock('@/services/cvService', () => ({
  cvService: { list: vi.fn() },
}))
const list = vi.mocked(cvService.list)

beforeEach(() => list.mockReset())

function setup() {
  return render(
    <MemoryRouter initialEntries={['/cvs']}>
      <Routes>
        <Route path="/cvs" element={<MyCVs />} />
        <Route path="/cvs/new" element={<div>NEW CV PAGE</div>} />
        <Route path="/cvs/:id" element={<div>CV DETAIL</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const cv = (over: Partial<CVSummary>): CVSummary => ({
  id: 1,
  title: 'Backend CV',
  template: 'professional',
  current_version_number: 2,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  ...over,
})

describe('<MyCVs />', () => {
  it('shows an empty state and routes to create', async () => {
    list.mockResolvedValue([])
    const user = userEvent.setup()
    setup()

    expect(await screen.findByText(/haven.t created any CVs/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /create your first cv/i }))
    expect(screen.getByText('NEW CV PAGE')).toBeInTheDocument()
  })

  it('renders a card per CV', async () => {
    list.mockResolvedValue([cv({ id: 1, title: 'Backend CV' }), cv({ id: 2, title: 'Data CV' })])
    setup()

    expect(await screen.findByText('Backend CV')).toBeInTheDocument()
    expect(screen.getByText('Data CV')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /backend cv/i })).toHaveAttribute('href', '/cvs/1')
  })

  it('recovers from a load error', async () => {
    list.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce([])
    const user = userEvent.setup()
    setup()

    const retry = await screen.findByRole('button', { name: /try again/i })
    expect(screen.getByRole('alert')).toHaveTextContent(/network down/i)
    await user.click(retry)
    expect(await screen.findByText(/haven.t created any CVs/i)).toBeInTheDocument()
  })
})
