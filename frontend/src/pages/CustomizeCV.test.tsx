import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { emptyCVContent } from '@/lib/cv'
import { analysisService } from '@/services/analysisService'
import { jobService } from '@/services/jobService'
import type { AnalysisResponse, CVResponse, JobDescription } from '@/types'
import CustomizeCV from './CustomizeCV'

vi.mock('@/services/jobService', () => ({
  jobService: { list: vi.fn(), create: vi.fn(), remove: vi.fn(), customize: vi.fn() },
}))
vi.mock('@/services/analysisService', () => ({
  analysisService: { analyze: vi.fn(), listForCv: vi.fn() },
}))
vi.mock('@/services/cvService', () => ({ cvService: { downloadPdf: vi.fn() } }))
vi.mock('@/lib/download', () => ({ saveBlob: vi.fn() }))

const list = vi.mocked(jobService.list)
const create = vi.mocked(jobService.create)
const customize = vi.mocked(jobService.customize)
const analyze = vi.mocked(analysisService.analyze)

const job = (over: Partial<JobDescription> = {}): JobDescription => ({
  id: 3,
  title: 'Backend Engineer',
  company: 'Acme',
  description: 'Python, FastAPI',
  created_at: '2026-01-01T00:00:00Z',
  ...over,
})

const tailoredCv = (): CVResponse => ({
  id: 5,
  title: 'My CV',
  template: 'professional',
  current_version_number: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  current_version: {
    id: 30,
    version_number: 3,
    source: 'job_customization',
    note: 'Tailored for Backend Engineer',
    content: { ...emptyCVContent(), summary: 'Tailored summary.' },
    created_at: '2026-01-02T00:00:00Z',
  },
})

const matchAnalysis = (): AnalysisResponse => ({
  id: 1,
  cv_id: 5,
  cv_version_number: 2,
  score: 64,
  results: {
    score: 64,
    strengths: ['Relevant skills'],
    weaknesses: [],
    missing: [],
    recommendations: [],
  },
  recommendations: [],
  created_at: '2026-02-01T00:00:00Z',
})

beforeEach(() => {
  vi.clearAllMocks()
  list.mockResolvedValue([])
})

function setup() {
  return render(
    <MemoryRouter initialEntries={['/cvs/5/customize']}>
      <Routes>
        <Route path="/cvs/:id/customize" element={<CustomizeCV />} />
        <Route path="/cvs/:id" element={<div>CV EDITOR</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('<CustomizeCV />', () => {
  it('disables the actions until a job is entered', async () => {
    setup()
    const tailor = await screen.findByRole('button', { name: /tailor cv for this job/i })
    expect(tailor).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Backend Engineer' } })
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Python, FastAPI, SQL' },
    })
    expect(tailor).toBeEnabled()
  })

  it('creates a new job then tailors the CV', async () => {
    create.mockResolvedValue(job({ id: 7 }))
    customize.mockResolvedValue(tailoredCv())
    const user = userEvent.setup()
    setup()

    fireEvent.change(await screen.findByLabelText('Job title'), {
      target: { value: 'Backend Engineer' },
    })
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Python, FastAPI' },
    })
    await user.click(screen.getByRole('button', { name: /tailor cv for this job/i }))

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(customize).toHaveBeenCalledWith({ cv_id: 5, job_description_id: 7 })
    expect(await screen.findByText('Tailored version saved')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'CV preview' })).toHaveTextContent(
      'Tailored summary.',
    )
  })

  it('analyzes the match for a saved job without creating one', async () => {
    list.mockResolvedValue([job({ id: 3 })])
    analyze.mockResolvedValue(matchAnalysis())
    const user = userEvent.setup()
    setup()

    await screen.findByLabelText('Job description') // the <select>
    fireEvent.change(screen.getByLabelText('Job description'), { target: { value: '3' } })
    await user.click(screen.getByRole('button', { name: /analyze match/i }))

    await waitFor(() => expect(analyze).toHaveBeenCalledWith({ cv_id: 5, job_description_id: 3 }))
    expect(create).not.toHaveBeenCalled()
    const panel = screen.getByRole('heading', { name: 'Match analysis' })
      .parentElement as HTMLElement
    expect(within(panel).getByText('64')).toBeInTheDocument()
  })

  it('surfaces a 503', async () => {
    const err = new AxiosError('Request failed')
    err.response = {
      status: 503,
      data: { detail: 'AI service is not configured' },
    } as AxiosError['response']
    customize.mockRejectedValue(err)
    create.mockResolvedValue(job({ id: 7 }))
    const user = userEvent.setup()
    setup()

    fireEvent.change(await screen.findByLabelText('Job title'), { target: { value: 'Dev' } })
    fireEvent.change(screen.getByLabelText(/job description/i), { target: { value: 'stuff' } })
    await user.click(screen.getByRole('button', { name: /tailor cv for this job/i }))
    expect(await screen.findByText(/ai service is not configured/i)).toBeInTheDocument()
  })
})
