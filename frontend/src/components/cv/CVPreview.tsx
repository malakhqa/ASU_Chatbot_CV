import type {
  CertificationItem,
  CVContent,
  EducationItem,
  ExperienceItem,
  ProjectItem,
} from '@/types'

function dateRange(start?: string, end?: string, current?: boolean): string {
  const s = (start ?? '').trim()
  const e = current ? 'Present' : (end ?? '').trim()
  if (s && e) return `${s} – ${e}`
  return s || e
}

function Experience({ items }: { items: ExperienceItem[] }) {
  return (
    <section>
      <h2>Experience</h2>
      {items.map((it, i) => (
        <div key={i} className="cv-preview__entry">
          <p className="cv-preview__entry-head">
            <strong>{[it.title, it.company].filter(Boolean).join(' — ') || 'Role'}</strong>
            <span className="cv-preview__meta">
              {[dateRange(it.start_date, it.end_date, it.current), it.location]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
          {it.description ? <p>{it.description}</p> : null}
          {it.highlights?.length ? (
            <ul>
              {it.highlights.map((h, j) => (
                <li key={j}>{h}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  )
}

function Education({ items }: { items: EducationItem[] }) {
  return (
    <section>
      <h2>Education</h2>
      {items.map((it, i) => (
        <div key={i} className="cv-preview__entry">
          <p className="cv-preview__entry-head">
            <strong>
              {[[it.degree, it.field_of_study].filter(Boolean).join(', '), it.institution]
                .filter(Boolean)
                .join(' — ') || 'Education'}
            </strong>
            <span className="cv-preview__meta">
              {[dateRange(it.start_date, it.end_date), it.gpa && `GPA ${it.gpa}`]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
          {it.description ? <p>{it.description}</p> : null}
        </div>
      ))}
    </section>
  )
}

function Projects({ items }: { items: ProjectItem[] }) {
  return (
    <section>
      <h2>Projects</h2>
      {items.map((it, i) => (
        <div key={i} className="cv-preview__entry">
          <p className="cv-preview__entry-head">
            <strong>{it.name || 'Project'}</strong>
            <span className="cv-preview__meta">{(it.technologies ?? []).join(', ')}</span>
          </p>
          {it.description ? <p>{it.description}</p> : null}
          {it.highlights?.length ? (
            <ul>
              {it.highlights.map((h, j) => (
                <li key={j}>{h}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  )
}

function Certifications({ items }: { items: CertificationItem[] }) {
  return (
    <section>
      <h2>Certifications</h2>
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            {[it.name, it.issuer, it.issue_date && `(${it.issue_date})`]
              .filter(Boolean)
              .join(' — ')}
          </li>
        ))}
      </ul>
    </section>
  )
}

export interface CVPreviewProps {
  content: CVContent
  template: string
}

export function CVPreview({ content, template }: CVPreviewProps) {
  const pi = content.personal_info
  const contact = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github, pi.website]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className={`cv-preview cv-preview--${template}`} aria-label="CV preview">
      <header className="cv-preview__header">
        <h1>{pi.full_name || 'Your Name'}</h1>
        {contact ? <p className="cv-preview__contact">{contact}</p> : null}
      </header>

      {content.summary.trim() ? (
        <section>
          <h2>Summary</h2>
          <p>{content.summary}</p>
        </section>
      ) : null}

      {content.experience.length ? <Experience items={content.experience} /> : null}
      {content.education.length ? <Education items={content.education} /> : null}
      {content.projects.length ? <Projects items={content.projects} /> : null}

      {content.skills.length ? (
        <section>
          <h2>Skills</h2>
          <p>{content.skills.join(', ')}</p>
        </section>
      ) : null}

      {content.certifications.length ? <Certifications items={content.certifications} /> : null}

      {content.languages.length ? (
        <section>
          <h2>Languages</h2>
          <p>
            {content.languages
              .map((l) => [l.name, l.proficiency].filter(Boolean).join(' — '))
              .join(' · ')}
          </p>
        </section>
      ) : null}
    </article>
  )
}
