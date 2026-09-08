import { useId, type ReactNode } from 'react'

export interface SectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function Section({ title, description, children }: SectionProps) {
  const headingId = useId()
  return (
    <section className="profile-section" aria-labelledby={headingId}>
      <header className="profile-section__header">
        <h2 id={headingId}>{title}</h2>
        {description ? <p className="muted">{description}</p> : null}
      </header>
      {children}
    </section>
  )
}
