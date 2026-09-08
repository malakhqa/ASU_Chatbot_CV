interface ListCardProps {
  title: string
  tone: 'good' | 'warn' | 'info'
  items: string[]
}

function ListCard({ title, tone, items }: ListCardProps) {
  return (
    <div className={`list-card list-card--${tone}`}>
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nothing flagged here.</p>
      )}
    </div>
  )
}

export interface AnalysisResultProps {
  strengths: string[]
  weaknesses: string[]
  missing: string[]
}

export function AnalysisResult({ strengths, weaknesses, missing }: AnalysisResultProps) {
  return (
    <div className="analysis-grid">
      <ListCard title="Strengths" tone="good" items={strengths} />
      <ListCard title="Weaknesses" tone="warn" items={weaknesses} />
      <ListCard title="Missing / keywords" tone="info" items={missing} />
    </div>
  )
}
