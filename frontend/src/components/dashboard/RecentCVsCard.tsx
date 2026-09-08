import { Link } from 'react-router-dom'

import { templateLabel } from '@/lib/cv'
import { formatDate } from '@/lib/format'
import type { CVSummary } from '@/types'

export interface RecentCVsCardProps {
  cvs: CVSummary[]
}

export function RecentCVsCard({ cvs }: RecentCVsCardProps) {
  const recent = cvs.slice(0, 4)

  return (
    <div className="dash-card">
      <div className="dash-card__head">
        <h2>Your CVs ({cvs.length})</h2>
        <Link to="/cvs/new" className="btn btn--secondary">
          New CV
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="muted">No CVs yet — create one to get started.</p>
      ) : (
        <ul className="dash-cv-list">
          {recent.map((cv) => (
            <li key={cv.id}>
              <Link to={`/cvs/${cv.id}`}>{cv.title}</Link>
              <span className="muted">
                {templateLabel(cv.template)} &middot; updated {formatDate(cv.updated_at)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {cvs.length > recent.length ? (
        <Link to="/cvs" className="dash-card__more">
          View all {cvs.length} CVs
        </Link>
      ) : null}
    </div>
  )
}
