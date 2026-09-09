import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SkillGapResult } from '@/types'

import { SkillGapPanel } from './SkillGapPanel'

const result = (over: Partial<SkillGapResult> = {}): SkillGapResult => ({
  match_score: 60,
  have: ['Python', 'SQL'],
  missing: ['Kubernetes'],
  improve: ['Testing'],
  required: ['Python', 'SQL', 'Kubernetes'],
  summary: 'Good base, containers missing.',
  ...over,
})

describe('<SkillGapPanel />', () => {
  it('renders the score, the three buckets, the summary, and the required list', () => {
    render(<SkillGapPanel result={result()} />)

    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText(/good base, containers missing/i)).toBeInTheDocument()

    const have = screen.getByRole('heading', { name: 'You have' }).parentElement as HTMLElement
    expect(within(have).getByText('Python')).toBeInTheDocument()

    const missing = screen.getByRole('heading', { name: 'Missing' }).parentElement as HTMLElement
    expect(within(missing).getByText('Kubernetes')).toBeInTheDocument()

    expect(screen.getByText(/role asks for:/i).closest('p')).toHaveTextContent(
      'Python · SQL · Kubernetes',
    )
  })

  it('shows "None." for an empty bucket', () => {
    render(<SkillGapPanel result={result({ improve: [] })} />)
    const improve = screen.getByRole('heading', { name: 'Worth strengthening' })
      .parentElement as HTMLElement
    expect(within(improve).getByText('None.')).toBeInTheDocument()
  })
})
