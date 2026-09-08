import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ScoreCard } from './ScoreCard'

describe('<ScoreCard />', () => {
  it('shows a strong score', () => {
    const { container } = render(<ScoreCard score={85} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('/100')).toBeInTheDocument()
    expect(screen.getByText('Strong')).toBeInTheDocument()
    expect(container.querySelector('.score-card--strong')).toBeInTheDocument()
  })

  it('bands a middling score as Solid', () => {
    const { container } = render(<ScoreCard score={65} />)
    expect(screen.getByText('Solid')).toBeInTheDocument()
    expect(container.querySelector('.score-card--ok')).toBeInTheDocument()
  })

  it('handles a null score', () => {
    render(<ScoreCard score={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Needs work')).toBeInTheDocument()
  })
})
