import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { emptyCVContent } from '@/lib/cv'
import type { CVContent } from '@/types'
import { CVPreview } from './CVPreview'

describe('<CVPreview />', () => {
  it('falls back to a placeholder name and hides empty sections', () => {
    render(<CVPreview content={emptyCVContent()} template="professional" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your Name')
    expect(screen.queryByRole('heading', { name: 'Experience' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Summary' })).not.toBeInTheDocument()
  })

  it('renders contact, summary and filled sections', () => {
    const content: CVContent = {
      ...emptyCVContent(),
      personal_info: { full_name: 'Layla Hassan', email: 'l@example.com', location: 'Cairo' },
      summary: 'Backend-focused CS student.',
      skills: ['Python', 'FastAPI'],
      experience: [
        {
          title: 'Intern',
          company: 'Acme',
          start_date: '2024',
          current: true,
          highlights: ['Shipped an API'],
        },
      ],
    }
    render(<CVPreview content={content} template="modern" />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Layla Hassan')
    expect(screen.getByText(/l@example.com · Cairo/)).toBeInTheDocument()
    expect(screen.getByText('Backend-focused CS student.')).toBeInTheDocument()
    expect(screen.getByText('Python, FastAPI')).toBeInTheDocument()

    const exp = screen.getByRole('heading', { name: 'Experience' }).parentElement as HTMLElement
    expect(within(exp).getByText(/Intern — Acme/)).toBeInTheDocument()
    expect(within(exp).getByText(/2024 – Present/)).toBeInTheDocument()
    expect(within(exp).getByText('Shipped an API')).toBeInTheDocument()
  })

  it('carries a template modifier class and, for academic, leads with education', () => {
    const content: CVContent = {
      ...emptyCVContent(),
      personal_info: { full_name: 'A' },
      experience: [{ title: 'Intern', company: 'Acme' }],
      education: [{ institution: 'ASU', degree: 'BSc' }],
    }

    const { rerender } = render(<CVPreview content={content} template="professional" />)
    expect(screen.getByLabelText('CV preview')).toHaveClass('cv-preview--professional')
    let headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings.indexOf('Experience')).toBeLessThan(headings.indexOf('Education'))

    rerender(<CVPreview content={content} template="academic" />)
    expect(screen.getByLabelText('CV preview')).toHaveClass('cv-preview--academic')
    headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings.indexOf('Education')).toBeLessThan(headings.indexOf('Experience'))
  })
})
