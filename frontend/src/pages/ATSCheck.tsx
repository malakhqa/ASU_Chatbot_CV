import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ATSResultPanel } from '@/components/ats'
import { Button, ErrorMessage, Loading } from '@/components/common'
import { atsService } from '@/services/atsService'
import type { ATSResult } from '@/types'

export default function ATSCheck() {
  const { id } = useParams<{ id: string }>()
  const cvId = Number(id)

  const [result, setResult] = useState<ATSResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      setResult(await atsService.check({ cv_id: cvId }))
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
        <h1>ATS check</h1>
        <Button onClick={run} loading={running}>
          {result ? 'Re-run check' : 'Run check'}
        </Button>
      </div>

      <ErrorMessage error={error} />

      {running && !result ? (
        <Loading label="Checking ATS readiness…" />
      ) : result ? (
        <ATSResultPanel result={result} />
      ) : (
        <div className="empty-state">
          <p>No ATS check yet.</p>
          <p className="muted">
            Run one to see how cleanly an Applicant Tracking System can parse this CV — section
            headings, keywords, formatting, and filler content.
          </p>
        </div>
      )}
    </section>
  )
}
