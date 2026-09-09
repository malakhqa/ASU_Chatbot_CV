import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button, ErrorMessage, Loading } from '@/components/common'
import { InterviewPrepPanel } from '@/components/interview'
import { interviewService } from '@/services/interviewService'
import type { InterviewPrepResult } from '@/types'

export default function InterviewPrep() {
  const { id } = useParams<{ id: string }>()
  const cvId = Number(id)

  const [result, setResult] = useState<InterviewPrepResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      setResult(await interviewService.prepare({ cv_id: cvId }))
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
        <h1>Interview prep</h1>
        <Button onClick={run} loading={running}>
          {result ? 'Regenerate' : 'Generate questions'}
        </Button>
      </div>

      <ErrorMessage error={error} />

      {running && !result ? (
        <Loading label="Preparing your interview questions…" />
      ) : result ? (
        <InterviewPrepPanel result={result} />
      ) : (
        <div className="empty-state">
          <p>No questions yet.</p>
          <p className="muted">
            Generate a set of likely interview questions from this CV — behavioral, technical, and
            role-specific — each with a note on what a strong answer covers.
          </p>
        </div>
      )}
    </section>
  )
}
