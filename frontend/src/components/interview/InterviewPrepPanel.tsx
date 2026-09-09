import type { InterviewPrepResult, InterviewQuestion, QuestionCategory } from '@/types'

const CATEGORY_LABEL: Record<QuestionCategory, string> = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  experience: 'Your experience',
  role_specific: 'Role-specific',
  motivation: 'Motivation & fit',
}
const CATEGORY_ORDER: QuestionCategory[] = [
  'behavioral',
  'experience',
  'technical',
  'role_specific',
  'motivation',
]

function groupByCategory(questions: InterviewQuestion[]) {
  const groups = new Map<QuestionCategory, InterviewQuestion[]>()
  for (const q of questions) {
    const list = groups.get(q.category) ?? []
    list.push(q)
    groups.set(q.category, list)
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => ({
    category: c,
    items: groups.get(c) as InterviewQuestion[],
  }))
}

export interface InterviewPrepPanelProps {
  result: InterviewPrepResult
}

export function InterviewPrepPanel({ result }: InterviewPrepPanelProps) {
  const groups = groupByCategory(result.questions)

  return (
    <div className="interview-prep">
      {result.focus_areas.length ? (
        <div className="list-card list-card--info">
          <h3>Be ready to talk about</h3>
          <ul>
            {result.focus_areas.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {groups.map(({ category, items }) => (
        <section key={category} className="interview-group">
          <h2>{CATEGORY_LABEL[category]}</h2>
          <ol className="interview-questions">
            {items.map((q, i) => (
              <li key={i}>
                <p className="interview-question">{q.question}</p>
                {q.guidance ? <p className="muted interview-guidance">{q.guidance}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ))}

      {result.tips.length ? (
        <div className="recommendations">
          <h2>Tips</h2>
          <ul>
            {result.tips.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
