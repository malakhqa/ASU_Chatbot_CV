export interface RecommendationsProps {
  items: string[]
}

export function Recommendations({ items }: RecommendationsProps) {
  if (!items.length) return null
  return (
    <div className="recommendations">
      <h2>Recommendations</h2>
      <ol>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ol>
    </div>
  )
}
