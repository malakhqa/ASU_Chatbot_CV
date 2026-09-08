import type { JobDescriptionCreate } from '@/types'

export type JobChoice = { kind: 'saved'; id: number } | { kind: 'new'; data: JobDescriptionCreate }

export interface JobDraft {
  savedId: number | null
  title: string
  company: string
  description: string
}

export const EMPTY_JOB_DRAFT: JobDraft = {
  savedId: null,
  title: '',
  company: '',
  description: '',
}

/** Resolve the current form state into a JobChoice, or null if incomplete. */
export function jobChoiceFromDraft(draft: JobDraft): JobChoice | null {
  if (draft.savedId != null) return { kind: 'saved', id: draft.savedId }
  if (!draft.title.trim() || !draft.description.trim()) return null
  return {
    kind: 'new',
    data: {
      title: draft.title.trim(),
      company: draft.company.trim() || null,
      description: draft.description.trim(),
    },
  }
}
