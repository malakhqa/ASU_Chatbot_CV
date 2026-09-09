import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EMPTY_JOB_DRAFT } from '@/lib/job'

import { JobDescriptionForm } from './JobDescriptionForm'

describe('<JobDescriptionForm />', () => {
  it('does not show the required error until the title field is touched', () => {
    render(<JobDescriptionForm savedJobs={[]} draft={EMPTY_JOB_DRAFT} onChange={vi.fn()} />)

    expect(screen.queryByText(/job title is required/i)).not.toBeInTheDocument()

    fireEvent.blur(screen.getByLabelText('Job title'))
    expect(screen.getByText(/job title is required/i)).toBeInTheDocument()
  })
})
