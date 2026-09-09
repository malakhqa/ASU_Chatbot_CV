import { Recommendations, ScoreCard } from '@/components/analyzer'
import type { ATSFinding, ATSResult, ATSSeverity } from '@/types'

const SEVERITY_ORDER: Record<ATSSeverity, number> = { high: 0, medium: 1, low: 2 }
const SEVERITY_LABEL: Record<ATSSeverity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function FindingRow({ finding }: { finding: ATSFinding }) {
  return (
    <li className="ats-finding">
      <span className={`ats-finding__sev ats-finding__sev--${finding.severity}`}>
        {SEVERITY_LABEL[finding.severity]}
      </span>
      <span className="ats-finding__cat">{finding.category}</span>
      <span className="ats-finding__msg">{finding.message}</span>
    </li>
  )
}

export interface ATSResultPanelProps {
  result: ATSResult
}

export function ATSResultPanel({ result }: ATSResultPanelProps) {
  const findings = [...result.findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  )

  return (
    <div className="analysis-panel">
      <div className="analysis-panel__top">
        <ScoreCard score={result.score} />
        <p className="muted">ATS readiness — how cleanly a parser can read this CV.</p>
      </div>

      <div className="analysis-grid">
        <div className="list-card list-card--good">
          <h3>Passing checks</h3>
          {result.passed.length ? (
            <ul>
              {result.passed.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nothing passing yet.</p>
          )}
        </div>

        <div className="list-card list-card--warn ats-findings-card">
          <h3>Findings</h3>
          {findings.length ? (
            <ul className="ats-findings">
              {findings.map((f, i) => (
                <FindingRow key={i} finding={f} />
              ))}
            </ul>
          ) : (
            <p className="muted">No ATS issues flagged.</p>
          )}
        </div>
      </div>

      <Recommendations items={result.recommendations} />
    </div>
  )
}
