import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { atsService } from '@/services/atsService'
import type { ATSResult } from '@/types'

import ATSCheck from './ATSCheck'

vi.mock('@/services/atsService', () => ({
  atsService: { check: vi.fn() },
}))
const check = vi.mocked(atsService.check)

const result = (over: Partial<ATSResult> = {}): ATSResult => ({
  score: 71,
  passed: ['Standard headings'],
  findings: [
    { category: 'formatting', severity: 'low', message: 'Avoid the header/footer area.' },
    { category: 'keywords', severity: 'high', message: 'Missing cloud keywords.' },
  ],
  recommendations: ['Add the job’s exact skill terms'],
  ...over,
})

beforeEach(() => {
  check.mockReset()
})

function setup() {
  return render(
    <MemoryRouter initialEntries={['/cvs/5/ats']}>
      <Routes>
        <Route path="/cvs/:id/ats" element={<ATSCheck />} />
        <Route path="/cvs/:id" element={<div>CV PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('<ATSCheck />', () => {
  it('shows an empty state, runs the check, and renders it (findings sorted by severity)', async () => {
    check.mockResolvedValue(result())
    const user = userEvent.setup()
    setup()

    expect(screen.getByText(/no ats check yet/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /run check/i }))

    await waitFor(() => expect(check).toHaveBeenCalledWith({ cv_id: 5 }))
    expect(screen.getByText('71')).toBeInTheDocument()
    expect(screen.getByText('Standard headings')).toBeInTheDocument()

    // findings sorted high severity first
    const severities = screen.getAllByText(/^(High|Medium|Low)$/)
    expect(severities.map((el) => el.textContent)).toEqual(['High', 'Low'])
    expect(screen.getByText(/missing cloud keywords/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /re-run check/i })).toBeInTheDocument()
  })

  it('replaces the empty state with a loader while the first run is in flight', async () => {
    let resolve!: (r: ATSResult) => void
    check.mockReturnValue(new Promise<ATSResult>((r) => (resolve = r)))
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /run check/i }))
    expect(screen.queryByText(/no ats check yet/i)).not.toBeInTheDocument()
    expect(screen.getByText(/checking ats readiness/i)).toBeInTheDocument()

    resolve(result())
    expect(await screen.findByText('71')).toBeInTheDocument()
  })

  it('surfaces a 503 when AI is not configured', async () => {
    const err = new AxiosError('Request failed')
    err.response = {
      status: 503,
      data: { detail: 'The AI service is not configured, or its API key was rejected.' },
    } as AxiosError['response']
    check.mockRejectedValue(err)
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /run check/i }))
    expect(await screen.findByText(/ai service is not configured/i)).toBeInTheDocument()
  })
})
