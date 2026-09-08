import { Input, Select, TextArea } from '@/components/common'
import type { JobDraft } from '@/lib/job'
import { validateRequired } from '@/lib/validation'
import type { JobDescription } from '@/types'

export interface JobDescriptionFormProps {
  savedJobs: JobDescription[]
  draft: JobDraft
  onChange: (patch: Partial<JobDraft>) => void
}

export function JobDescriptionForm({ savedJobs, draft, onChange }: JobDescriptionFormProps) {
  const usingSaved = draft.savedId != null

  return (
    <div className="profile-section">
      {savedJobs.length > 0 ? (
        <Select
          label="Job description"
          value={draft.savedId != null ? String(draft.savedId) : ''}
          onChange={(e) => onChange({ savedId: e.target.value ? Number(e.target.value) : null })}
          options={[
            { value: '', label: 'New job description…' },
            ...savedJobs.map((j) => ({
              value: String(j.id),
              label: j.company ? `${j.title} — ${j.company}` : j.title,
            })),
          ]}
        />
      ) : null}

      {!usingSaved ? (
        <>
          <div className="grid-2">
            <Input
              label="Job title"
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              error={draft.title.trim() ? undefined : validateRequired(draft.title, 'Job title')}
            />
            <Input
              label="Company"
              value={draft.company}
              onChange={(e) => onChange({ company: e.target.value })}
            />
          </div>
          <TextArea
            label="Job description / requirements"
            rows={7}
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Paste the full job posting here."
          />
        </>
      ) : null}
    </div>
  )
}
