export interface ScoreCardProps {
  score: number | null
}

function band(score: number): { key: string; label: string } {
  if (score >= 80) return { key: 'strong', label: 'Strong' }
  if (score >= 60) return { key: 'ok', label: 'Solid' }
  return { key: 'weak', label: 'Needs work' }
}

export function ScoreCard({ score }: ScoreCardProps) {
  const value = score ?? 0
  const { key, label } = band(value)

  return (
    <div className={`score-card score-card--${key}`} role="group" aria-label="Overall CV score">
      <div className="score-card__value">
        {score ?? '—'}
        <span className="score-card__max">/100</span>
      </div>
      <div className="score-card__label">{label}</div>
      <div className="score-card__bar" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}
