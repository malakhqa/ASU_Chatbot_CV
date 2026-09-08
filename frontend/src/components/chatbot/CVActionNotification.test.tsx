import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ChatActionState } from '@/hooks/useChat'

import { CVActionNotification } from './CVActionNotification'

const base: ChatActionState = {
  action: { type: 'cv_update', section: 'skills', action: 'add', content: 'Python' },
  applied: false,
  versionNumber: null,
}

describe('<CVActionNotification />', () => {
  it('shows an applied change with the new version', () => {
    render(<CVActionNotification state={{ ...base, applied: true, versionNumber: 4 }} />)
    expect(screen.getByText(/CV updated/)).toBeInTheDocument()
    expect(screen.getByText(/add skills/)).toBeInTheDocument()
    expect(screen.getByText(/now v4/)).toBeInTheDocument()
  })

  it('shows a proposed change when not applied', () => {
    render(<CVActionNotification state={base} />)
    expect(screen.getByText(/Suggested change/)).toBeInTheDocument()
    expect(screen.getByText(/Open this chat from a CV editor/)).toBeInTheDocument()
  })
})
