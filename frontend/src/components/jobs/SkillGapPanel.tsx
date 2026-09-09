import { ScoreCard } from '@/components/analyzer'
import type { SkillGapResult } from '@/types'

function Chips({ items, tone }: { items: string[]; tone: 'good' | 'warn' | 'info' }) {
  if (!items.length) return <p className="muted">None.</p>
  return (
    <ul className={`skill-chips skill-chips--${tone}`}>
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  )
}

export interface SkillGapPanelProps {
  result: SkillGapResult
}

/** Compares the candidate's skills with a target job's requirements. */
export function SkillGapPanel({ result }: SkillGapPanelProps) {
  return (
    <div className="job-analysis">
      <h2>Skill gap</h2>
      <div className="analysis-panel">
        <div className="analysis-panel__top">
          <ScoreCard score={result.match_score} />
          <p className="muted">
            {result.summary || 'How your skills line up with what this role asks for.'}
          </p>
        </div>

        <div className="analysis-grid">
          <div className="list-card list-card--good">
            <h3>You have</h3>
            <Chips items={result.have} tone="good" />
          </div>
          <div className="list-card list-card--warn">
            <h3>Missing</h3>
            <Chips items={result.missing} tone="warn" />
          </div>
          <div className="list-card list-card--info">
            <h3>Worth strengthening</h3>
            <Chips items={result.improve} tone="info" />
          </div>
        </div>

        {result.required.length ? (
          <p className="muted skill-gap__required">
            <strong>Role asks for:</strong> {result.required.join(' · ')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
