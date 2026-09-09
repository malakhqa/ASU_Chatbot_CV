import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { InterviewPrepResult } from '@/types'

import { InterviewPrepPanel } from './InterviewPrepPanel'

const result = (over: Partial<InterviewPrepResult> = {}): InterviewPrepResult => ({
  questions: [
    { category: 'technical', question: 'Explain REST vs RPC.', guidance: 'Use your API work.' },
    {
      category: 'behavioral',
      question: 'A time you disagreed with a teammate?',
      guidance: 'STAR.',
    },
    {
      category: 'behavioral',
      question: 'A deadline you missed?',
      guidance: 'Own it, show learning.',
    },
  ],
  focus_areas: ['The Acme internship'],
  tips: ['Prepare two STAR stories'],
  ...over,
})

describe('<InterviewPrepPanel />', () => {
  it('groups questions by category with guidance, and shows focus areas + tips', () => {
    render(<InterviewPrepPanel result={result()} />)

    // behavioral group renders before technical (CATEGORY_ORDER)
    const groupHeadings = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
      .filter((t) => t !== 'Tips')
    expect(groupHeadings).toEqual(['Behavioral', 'Technical'])

    const behavioral = screen.getByRole('heading', { name: 'Behavioral' })
      .parentElement as HTMLElement
    expect(within(behavioral).getAllByRole('listitem')).toHaveLength(2)
    expect(within(behavioral).getByText('STAR.')).toBeInTheDocument()

    expect(screen.getByText('The Acme internship')).toBeInTheDocument()
    expect(screen.getByText('Prepare two STAR stories')).toBeInTheDocument()
  })

  it('omits the focus-areas and tips blocks when empty', () => {
    render(<InterviewPrepPanel result={result({ focus_areas: [], tips: [] })} />)
    expect(screen.queryByText(/be ready to talk about/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tips' })).not.toBeInTheDocument()
  })
})
