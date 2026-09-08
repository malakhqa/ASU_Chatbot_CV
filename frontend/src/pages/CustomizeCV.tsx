import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button, ErrorMessage } from '@/components/common'
import { CustomizedCV, JobAnalysis, JobDescriptionForm } from '@/components/jobs'
import { saveBlob } from '@/lib/download'
import { EMPTY_JOB_DRAFT, jobChoiceFromDraft, type JobDraft } from '@/lib/job'
import { analysisService } from '@/services/analysisService'
import { cvService } from '@/services/cvService'
import { jobService } from '@/services/jobService'
import type { AnalysisResponse, CVResponse, JobDescription } from '@/types'

export default function CustomizeCV() {
  const { id } = useParams<{ id: string }>()
  const cvId = Number(id)

  const [savedJobs, setSavedJobs] = useState<JobDescription[]>([])
  const [draft, setDraft] = useState<JobDraft>(EMPTY_JOB_DRAFT)
  const [match, setMatch] = useState<AnalysisResponse | null>(null)
  const [result, setResult] = useState<CVResponse | null>(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    jobService
      .list()
      .then(setSavedJobs)
      .catch(() => setSavedJobs([]))
  }, [])

  const choice = jobChoiceFromDraft(draft)
  const busy = analyzing || customizing

  const patch = (p: Partial<JobDraft>) => setDraft((d) => ({ ...d, ...p }))

  /** Return an id for the chosen job, creating & saving it first if it's new. */
  const ensureJobId = async (): Promise<number> => {
    if (!choice) throw new Error('Enter a job title and description first.')
    if (choice.kind === 'saved') return choice.id
    const created = await jobService.create(choice.data)
    setSavedJobs((jobs) => [created, ...jobs])
    setDraft((d) => ({ ...d, savedId: created.id }))
    return created.id
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const jobId = await ensureJobId()
      setMatch(await analysisService.analyze({ cv_id: cvId, job_description_id: jobId }))
    } catch (e) {
      setError(e)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCustomize = async () => {
    setCustomizing(true)
    setError(null)
    try {
      const jobId = await ensureJobId()
      setResult(await jobService.customize({ cv_id: cvId, job_description_id: jobId }))
    } catch (e) {
      setError(e)
    } finally {
      setCustomizing(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const { blob, filename } = await cvService.downloadPdf(cvId, `cv-${cvId}.pdf`)
      saveBlob(blob, filename)
    } catch (e) {
      setError(e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="page">
      <Link to={`/cvs/${cvId}`}>&larr; Back to CV</Link>
      <h1>Tailor this CV to a job</h1>
      <p className="muted">
        Pick a saved job or paste a new one. Tailoring rewrites and reorders your existing content
        to match the role — it never invents new experience.
      </p>

      <JobDescriptionForm savedJobs={savedJobs} draft={draft} onChange={patch} />

      <ErrorMessage error={error} />

      <div className="create-cv__actions">
        <Button onClick={handleCustomize} loading={customizing} disabled={!choice || busy}>
          Tailor CV for this job
        </Button>
        <Button
          variant="secondary"
          onClick={handleAnalyze}
          loading={analyzing}
          disabled={!choice || busy}
        >
          Analyze match
        </Button>
      </div>

      <JobAnalysis analysis={match} />

      {result ? (
        <CustomizedCV cv={result} downloading={downloading} onDownload={handleDownload} />
      ) : null}
    </section>
  )
}
