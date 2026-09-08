import { Link, useNavigate } from 'react-router-dom'

import { Button, ErrorMessage, Loading } from '@/components/common'
import { useCVs } from '@/hooks/useCVs'
import { templateLabel } from '@/lib/cv'
import { formatDate } from '@/lib/format'

export default function MyCVs() {
  const { cvs, status, error, reload } = useCVs()
  const navigate = useNavigate()

  if (status === 'loading') return <Loading label="Loading your CVs…" />

  return (
    <section className="page">
      <div className="page__header">
        <h1>My CVs</h1>
        {cvs.length > 0 ? <Button onClick={() => navigate('/cvs/new')}>Create CV</Button> : null}
      </div>

      {status === 'error' ? (
        <>
          <ErrorMessage error={error} fallback="Could not load your CVs." />
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        </>
      ) : cvs.length === 0 ? (
        <div className="empty-state">
          <p>You haven&rsquo;t created any CVs yet.</p>
          <Button onClick={() => navigate('/cvs/new')}>Create your first CV</Button>
        </div>
      ) : (
        <ul className="cv-grid">
          {cvs.map((cv) => (
            <li key={cv.id} className="cv-card">
              <Link to={`/cvs/${cv.id}`} className="cv-card__link">
                <h2 className="cv-card__title">{cv.title}</h2>
                <p className="muted">
                  {templateLabel(cv.template)} &middot; v{cv.current_version_number ?? 1}
                </p>
                <p className="cv-card__date">Updated {formatDate(cv.updated_at)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
