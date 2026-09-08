import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, ErrorMessage, Input, Select } from '@/components/common'
import { CV_TEMPLATES, templateLabel } from '@/lib/cv'
import { validateRequired } from '@/lib/validation'
import { cvService } from '@/services/cvService'

type Mode = 'generate' | 'blank'

const TEMPLATE_OPTIONS = CV_TEMPLATES.map((t) => ({ value: t, label: templateLabel(t) }))

export default function CreateCV() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState<string>('professional')
  const [titleError, setTitleError] = useState<string>()
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState<Mode | null>(null)

  const create = async (mode: Mode) => {
    const err = validateRequired(title, 'Title')
    setTitleError(err)
    if (err) return

    setBusy(mode)
    setError(null)
    try {
      const call = mode === 'generate' ? cvService.generate : cvService.create
      const cv = await call({ title: title.trim(), template })
      navigate(`/cvs/${cv.id}`, { replace: true })
    } catch (e) {
      setError(e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="page page--narrow">
      <h1>Create a CV</h1>

      <Input
        label="Title"
        placeholder="e.g. Backend Engineer CV"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => setTitleError(validateRequired(title, 'Title'))}
        error={titleError}
        autoFocus
      />
      <Select
        label="Template"
        options={TEMPLATE_OPTIONS}
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
      />

      <ErrorMessage error={error} />

      <div className="create-cv__actions">
        <Button onClick={() => create('generate')} loading={busy === 'generate'} disabled={!!busy}>
          Generate from my profile
        </Button>
        <Button
          variant="secondary"
          onClick={() => create('blank')}
          loading={busy === 'blank'}
          disabled={!!busy}
        >
          Start blank
        </Button>
      </div>

      <p className="muted">
        Generating builds a first draft from your career profile using AI. If AI isn&rsquo;t
        configured, start blank and fill it in yourself.
      </p>
    </section>
  )
}
