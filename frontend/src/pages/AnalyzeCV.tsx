import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button, ErrorMessage, Loading } from '@/components/common'
import { AnalysisPanel } from '@/components/analyzer'
import { formatDate } from '@/lib/format'
import { analysisService } from '@/services/analysisService'
import type { AnalysisResponse } from '@/types'

function PastAnalyses({
  items,
  activeId,
  onSelect,
}: {
  items: AnalysisResponse[]
  activeId: number | undefined
  onSelect: (a: AnalysisResponse) => void
}) {
  if (items.length < 2) return null
  return (
    <div className="past-analyses">
      <h2>Previous analyses</h2>
      <ul>
        {items.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className={
                a.id === activeId ? 'past-analyses__item is-active' : 'past-analyses__item'
              }
              onClick={() => onSelect(a)}
            >
              <strong>{a.score ?? '—'}/100</strong>
              <span className="muted">
                {a.cv_version_number != null ? `v${a.cv_version_number} · ` : ''}
                {formatDate(a.created_at)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AnalyzeCV() {
  const { id } = useParams<{ id: string }>()
  const cvId = Number(id)

  const [history, setHistory] = useState<AnalysisResponse[]>([])
  const [current, setCurrent] = useState<AnalysisResponse | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingHistory(true)
    analysisService
      .listForCv(cvId)
      .then((list) => {
        if (cancelled) return
        setHistory(list)
        setCurrent(list[0] ?? null)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingHistory(false))
    return () => {
      cancelled = true
    }
  }, [cvId])

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      const analysis = await analysisService.analyze({ cv_id: cvId })
      setCurrent(analysis)
      setHistory((h) => [analysis, ...h])
    } catch (e) {
      setError(e)
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="page">
      <Link to={`/cvs/${cvId}`}>&larr; Back to CV</Link>

      <div className="page__header">
        <h1>CV Analysis</h1>
        <Button onClick={run} loading={running}>
          {current ? 'Re-run analysis' : 'Run analysis'}
        </Button>
      </div>

      <ErrorMessage error={error} />

      {loadingHistory ? (
        <Loading label="Loading previous analyses…" />
      ) : current ? (
        <>
          <AnalysisPanel analysis={current} />
          <PastAnalyses items={history} activeId={current.id} onSelect={setCurrent} />
        </>
      ) : (
        <div className="empty-state">
          <p>No analysis yet.</p>
          <p className="muted">
            Run one to get an overall score, strengths, weaknesses, and concrete recommendations for
            this CV.
          </p>
        </div>
      )}
    </section>
  )
}
