import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ErrorMessage, Loading } from '@/components/common'
import { templateLabel } from '@/lib/cv'
import { cvService } from '@/services/cvService'
import type { CVResponse } from '@/types'

// Placeholder — the full section editor + preview arrive in Task 18.
export default function EditCV() {
  const { id } = useParams<{ id: string }>()
  const [cv, setCv] = useState<CVResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    cvService
      .get(Number(id))
      .then((c) => {
        if (cancelled) return
        setCv(c)
        setStatus('ready')
      })
      .catch((e) => {
        if (cancelled) return
        setError(e)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (status === 'loading') return <Loading label="Loading CV…" />
  if (status === 'error' || !cv) {
    return (
      <section className="page">
        <Link to="/cvs">&larr; My CVs</Link>
        <ErrorMessage error={error} fallback="Could not load this CV." />
      </section>
    )
  }

  const content = cv.current_version?.content

  return (
    <section className="page">
      <Link to="/cvs">&larr; My CVs</Link>
      <div className="page__header">
        <div>
          <h1>{cv.title}</h1>
          <p className="muted">
            {templateLabel(cv.template)} &middot; v{cv.current_version_number ?? 1} &middot;{' '}
            {cv.current_version?.source ?? 'empty'}
          </p>
        </div>
        <span className="badge">Editor arrives in Task 18</span>
      </div>

      {content ? (
        <div className="profile-section">
          <h2>Summary</h2>
          <p>{content.summary || <span className="muted">— empty —</span>}</p>
          <h2>Skills</h2>
          <p>
            {content.skills.length ? (
              content.skills.join(', ')
            ) : (
              <span className="muted">— none —</span>
            )}
          </p>
        </div>
      ) : null}
    </section>
  )
}
