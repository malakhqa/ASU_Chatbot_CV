import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { analysisService } from '@/services/analysisService'
import type { AnalysisResponse } from '@/types'
import AnalyzeCV from './AnalyzeCV'

vi.mock('@/services/analysisService', () => ({
  analysisService: { analyze: vi.fn(), listForCv: vi.fn() },
}))
const analyze = vi.mocked(analysisService.analyze)
const listForCv = vi.mocked(analysisService.listForCv)

const analysis = (over: Partial<AnalysisResponse> = {}): AnalysisResponse => ({
  id: 1,
  cv_id: 5,
  cv_version_number: 2,
  score: 72,
  results: {
    score: 72,
    strengths: ['Clear structure'],
    weaknesses: ['Generic summary'],
    missing: ['GitHub link'],
    recommendations: ['Quantify achievements'],
  },
  recommendations: ['Quantify achievements'],
  created_at: '2026-02-01T00:00:00Z',
  ...over,
})

beforeEach(() => {
  analyze.mockReset()
  listForCv.mockReset()
})

function setup() {
  return render(
    <MemoryRouter initialEntries={['/cvs/5/analyze']}>
      <Routes>
        <Route path="/cvs/:id/analyze" element={<AnalyzeCV />} />
        <Route path="/cvs/:id" element={<div>CV PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('<AnalyzeCV />', () => {
  it('shows an empty state, then runs an analysis and renders it', async () => {
    listForCv.mockResolvedValue([])
    analyze.mockResolvedValue(analysis())
    const user = userEvent.setup()
    setup()

    expect(await screen.findByText(/no analysis yet/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /run analysis/i }))

    await waitFor(() => expect(analyze).toHaveBeenCalledWith({ cv_id: 5 }))
    expect(screen.getByText('72')).toBeInTheDocument()

    const strengths = screen.getByRole('heading', { name: 'Strengths' })
      .parentElement as HTMLElement
    expect(within(strengths).getByText('Clear structure')).toBeInTheDocument()

    const recs = screen.getByRole('heading', { name: 'Recommendations' })
      .parentElement as HTMLElement
    expect(within(recs).getByText('Quantify achievements')).toBeInTheDocument()
  })

  it('replaces the empty state with a loading indicator while the first run is in flight', async () => {
    listForCv.mockResolvedValue([])
    let resolve!: (a: AnalysisResponse) => void
    analyze.mockReturnValue(new Promise<AnalysisResponse>((r) => (resolve = r)))
    const user = userEvent.setup()
    setup()

    await user.click(await screen.findByRole('button', { name: /run analysis/i }))

    expect(screen.queryByText(/no analysis yet/i)).not.toBeInTheDocument()
    expect(screen.getByText(/analysing your cv/i)).toBeInTheDocument()

    resolve(analysis())
    expect(await screen.findByText('72')).toBeInTheDocument()
  })

  it('renders the most recent past analysis on load', async () => {
    listForCv.mockResolvedValue([analysis({ id: 9, score: 88 })])
    setup()
    expect(await screen.findByText('88')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /re-run analysis/i })).toBeInTheDocument()
  })

  it('surfaces a 503 when AI is not configured', async () => {
    listForCv.mockResolvedValue([])
    const err = new AxiosError('Request failed')
    err.response = {
      status: 503,
      data: { detail: 'AI service is not configured' },
    } as AxiosError['response']
    analyze.mockRejectedValue(err)
    const user = userEvent.setup()
    setup()

    await user.click(await screen.findByRole('button', { name: /run analysis/i }))
    expect(await screen.findByText(/ai service is not configured/i)).toBeInTheDocument()
  })

  it('lets you switch between previous analyses', async () => {
    listForCv.mockResolvedValue([
      analysis({ id: 2, score: 80, cv_version_number: 3 }),
      analysis({ id: 1, score: 60, cv_version_number: 2 }),
    ])
    const user = userEvent.setup()
    setup()

    expect(await screen.findByText('80')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /60\/100/ }))
    expect(screen.getByText('60')).toBeInTheDocument()
  })
})
