import { Link } from 'react-router-dom'

import type { ProfileCompleteness } from '@/lib/profile'

export interface ProfileStatusCardProps {
  completeness: ProfileCompleteness
}

export function ProfileStatusCard({ completeness }: ProfileStatusCardProps) {
  const { filled, total, pct, missing } = completeness
  const done = missing.length === 0

  return (
    <div className="dash-card">
      <h2>Career profile</h2>
      <div className="score-card__bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p>
        <strong>
          {filled} of {total}
        </strong>{' '}
        sections complete
      </p>
      {done ? (
        <p className="muted">Your profile is ready for CV generation.</p>
      ) : (
        <p className="muted">Still to add: {missing.join(', ')}.</p>
      )}
      <Link to="/profile" className="btn btn--secondary">
        {done ? 'Edit profile' : 'Complete profile'}
      </Link>
    </div>
  )
}
