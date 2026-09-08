import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Chatbot } from '@/components/chatbot'
import { ErrorMessage, Input, Loading } from '@/components/common'
import { CVActions, CVEditor, CVPreview, TemplateSelector, VersionHistory } from '@/components/cv'
import { useCV } from '@/hooks/useCV'
import { emptyCVContent } from '@/lib/cv'
import { saveBlob } from '@/lib/download'
import { cvService } from '@/services/cvService'
import type { CVContent, CVResponse, CVUpdateRequest, CVVersion } from '@/types'

interface Draft {
  title: string
  template: string
  content: CVContent
}

function draftFrom(cv: CVResponse): Draft {
  return {
    title: cv.title,
    template: cv.template,
    content: cv.current_version?.content ?? emptyCVContent(),
  }
}

export default function EditCV() {
  const { id } = useParams<{ id: string }>()
  const cvId = Number(id)
  const { cv, status, error, setCv, reload: reloadCv } = useCV(cvId)

  const [draft, setDraft] = useState<Draft | null>(null)
  const [versions, setVersions] = useState<CVVersion[]>([])

  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [restoring, setRestoring] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [actionError, setActionError] = useState<unknown>(null)

  // Seed / reset the draft whenever the loaded CV changes.
  useEffect(() => {
    if (cv) setDraft(draftFrom(cv))
  }, [cv])

  const loadVersions = useCallback(() => {
    cvService
      .listVersions(cvId)
      .then(setVersions)
      .catch(() => setVersions([]))
  }, [cvId])

  useEffect(() => {
    if (cv) loadVersions()
  }, [cv, loadVersions])

  const savedSnapshot = useMemo(() => (cv ? draftFrom(cv) : null), [cv])
  const contentDirty = Boolean(
    draft &&
    savedSnapshot &&
    JSON.stringify(draft.content) !== JSON.stringify(savedSnapshot.content),
  )
  const dirty = Boolean(
    draft &&
    savedSnapshot &&
    (draft.title !== savedSnapshot.title ||
      draft.template !== savedSnapshot.template ||
      contentDirty),
  )

  const patchDraft = (patch: Partial<Draft>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
    setSaved(false)
  }
  const patchContent = (patch: Partial<CVContent>) =>
    setDraft((d) => {
      if (!d) return d
      setSaved(false)
      return { ...d, content: { ...d.content, ...patch } }
    })

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    setActionError(null)
    try {
      const payload: CVUpdateRequest = { title: draft.title.trim(), template: draft.template }
      if (contentDirty) payload.content = draft.content
      const updated = await cvService.update(cvId, payload)
      setCv(updated)
      setSaved(true)
      loadVersions()
    } catch (e) {
      setActionError(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!draft) return
    setDownloading(true)
    setActionError(null)
    try {
      const { blob, filename } = await cvService.downloadPdf(
        cvId,
        `${draft.title.trim() || 'cv'}.pdf`,
      )
      saveBlob(blob, filename)
    } catch (e) {
      setActionError(e)
    } finally {
      setDownloading(false)
    }
  }

  const handleRestore = async (versionNumber: number) => {
    setRestoring(versionNumber)
    setActionError(null)
    try {
      const updated = await cvService.restoreVersion(cvId, versionNumber)
      setCv(updated)
      loadVersions()
    } catch (e) {
      setActionError(e)
    } finally {
      setRestoring(null)
    }
  }

  if (status === 'error' || (status === 'ready' && !cv)) {
    return (
      <section className="page">
        <Link to="/cvs">&larr; My CVs</Link>
        <ErrorMessage error={error} fallback="Could not load this CV." />
      </section>
    )
  }
  if (!cv || !draft) return <Loading label="Loading CV…" />

  return (
    <section className="page">
      <Link to="/cvs">&larr; My CVs</Link>

      <div className="cv-toolbar">
        <Input
          label="CV title"
          value={draft.title}
          onChange={(e) => patchDraft({ title: e.target.value })}
        />
        <TemplateSelector
          value={draft.template}
          onChange={(template) => patchDraft({ template })}
        />
        <Link to={`/cvs/${cvId}/analyze`} className="btn btn--secondary cv-toolbar__analyze">
          Analyze
        </Link>
        <Link to={`/cvs/${cvId}/customize`} className="btn btn--secondary cv-toolbar__analyze">
          Customize
        </Link>
        <CVActions
          dirty={dirty}
          saving={saving}
          downloading={downloading}
          saved={saved}
          onSave={handleSave}
          onDownload={handleDownload}
        />
      </div>

      <ErrorMessage error={actionError} />

      <VersionHistory
        versions={versions}
        currentNumber={cv.current_version_number}
        restoringNumber={restoring}
        onRestore={handleRestore}
      />

      <details className="chatbot-panel">
        <summary>Ask the AI assistant</summary>
        <p className="muted">
          Requests like “add Python to my skills” are applied straight to this CV as a new version.
        </p>
        <Chatbot
          cvId={cvId}
          onCvUpdated={() => {
            if (!dirty) reloadCv()
          }}
        />
      </details>

      <div className="cv-layout">
        <div className="cv-layout__editor">
          <CVEditor content={draft.content} onChange={patchContent} />
        </div>
        <aside className="cv-layout__preview">
          <CVPreview content={draft.content} template={draft.template} />
        </aside>
      </div>
    </section>
  )
}
