import { describe, expect, it } from 'vitest'

import { EMPTY_JOB_DRAFT, jobChoiceFromDraft } from './job'

describe('jobChoiceFromDraft', () => {
  it('returns null for an incomplete new job', () => {
    expect(jobChoiceFromDraft(EMPTY_JOB_DRAFT)).toBeNull()
    expect(jobChoiceFromDraft({ ...EMPTY_JOB_DRAFT, title: 'Dev' })).toBeNull()
  })

  it('trims a complete new job', () => {
    const choice = jobChoiceFromDraft({
      savedId: null,
      title: '  Backend Dev  ',
      company: '  Acme  ',
      description: '  Build APIs  ',
    })
    expect(choice).toEqual({
      kind: 'new',
      data: { title: 'Backend Dev', company: 'Acme', description: 'Build APIs' },
    })
  })

  it('nulls an empty company', () => {
    const choice = jobChoiceFromDraft({
      savedId: null,
      title: 'Dev',
      company: '   ',
      description: 'stuff',
    })
    expect(choice?.kind === 'new' && choice.data.company).toBeNull()
  })

  it('prefers a selected saved job', () => {
    expect(jobChoiceFromDraft({ ...EMPTY_JOB_DRAFT, savedId: 12, title: 'x' })).toEqual({
      kind: 'saved',
      id: 12,
    })
  })
})
