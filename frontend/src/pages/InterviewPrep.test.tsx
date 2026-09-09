import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { interviewService } from '@/services/interviewService'
import type { InterviewPrepResult } from '@/types'

import InterviewPrep from './InterviewPrep'

vi.mock('@/services/interviewService', () => ({
  interviewService: { prepare: vi.fn() },
}))
const prepare = vi.mocked(interviewService.prepare)

const result = (): InterviewPrepResult => ({
  questions: [
    { category: 'behavioral', question: 'Tell me about a challenge.', guidance: 'Use STAR.' },
    { category: 'technical', question: 'What is an index?', guidance: 'Mention your SQL work.' },
  ],
  focus_areas: ['Your capstone project'],
  tips: ['Practise out loud'],
})

beforeEach(() => {
  prepare.mockReset()
})

function setup() {
  return render(
    <MemoryRouter initialEntries={['/cvs/5/interview']}>
      <Routes>
        <Route path="/cvs/:id/interview" element={<InterviewPrep />} />
        <Route path="/cvs/:id" element={<div>CV PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('<InterviewPrep />', () => {
  it('shows an empty state, generates questions, and renders them', async () => {
    prepare.mockResolvedValue(result())
    const user = userEvent.setup()
    setup()

    expect(screen.getByText(/no questions yet/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /generate questions/i }))

    await waitFor(() => expect(prepare).toHaveBeenCalledWith({ cv_id: 5 }))
    expect(screen.getByText('Tell me about a challenge.')).toBeInTheDocument()
    expect(screen.getByText('Your capstone project')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument()
  })

  it('replaces the empty state with a loader while the first run is in flight', async () => {
    let resolve!: (r: InterviewPrepResult) => void
    prepare.mockReturnValue(new Promise<InterviewPrepResult>((r) => (resolve = r)))
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /generate questions/i }))
    expect(screen.queryByText(/no questions yet/i)).not.toBeInTheDocument()
    expect(screen.getByText(/preparing your interview questions/i)).toBeInTheDocument()

    resolve(result())
    expect(await screen.findByText('What is an index?')).toBeInTheDocument()
  })

  it('surfaces a 503 when AI is not configured', async () => {
    const err = new AxiosError('Request failed')
    err.response = {
      status: 503,
      data: { detail: 'The AI service is not configured, or its API key was rejected.' },
    } as AxiosError['response']
    prepare.mockRejectedValue(err)
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /generate questions/i }))
    expect(await screen.findByText(/ai service is not configured/i)).toBeInTheDocument()
  })
})
