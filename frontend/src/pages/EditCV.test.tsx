import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { emptyCVContent } from '@/lib/cv'
import { cvService } from '@/services/cvService'
import type { CVResponse, CVVersion } from '@/types'
import EditCV from './EditCV'

vi.mock('@/services/cvService', () => ({
  cvService: {
    get: vi.fn(),
    update: vi.fn(),
    listVersions: vi.fn(),
    restoreVersion: vi.fn(),
    downloadPdf: vi.fn(),
  },
}))
vi.mock('@/lib/download', () => ({ saveBlob: vi.fn() }))

import { saveBlob } from '@/lib/download'

const get = vi.mocked(cvService.get)
const update = vi.mocked(cvService.update)
const listVersions = vi.mocked(cvService.listVersions)
const restoreVersion = vi.mocked(cvService.restoreVersion)
const downloadPdf = vi.mocked(cvService.downloadPdf)

const version = (n: number, over: Partial<CVVersion> = {}): CVVersion => ({
  id: n,
  version_number: n,
  source: 'manual_edit',
  note: null,
  content: emptyCVContent(),
  created_at: '2026-01-01T00:00:00Z',
  ...over,
})

const cvResponse = (over: Partial<CVResponse> = {}): CVResponse => ({
  id: 5,
  title: 'Backend CV',
  template: 'professional',
  current_version_number: 2,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  current_version: version(2, { content: { ...emptyCVContent(), summary: 'Original.' } }),
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  get.mockResolvedValue(cvResponse())
  listVersions.mockResolvedValue([version(2), version(1)])
})

function setup() {
  return render(
    <MemoryRouter initialEntries={['/cvs/5']}>
      <Routes>
        <Route path="/cvs/:id" element={<EditCV />} />
        <Route path="/cvs" element={<div>CV LIST</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('<EditCV />', () => {
  it('loads the CV into the toolbar and preview', async () => {
    setup()
    expect(await screen.findByLabelText('CV title')).toHaveValue('Backend CV')
    const preview = screen.getByRole('article', { name: 'CV preview' })
    expect(within(preview).getByText('Original.')).toBeInTheDocument()
  })

  it('saves an edited section as a new version (content in payload)', async () => {
    update.mockResolvedValue(cvResponse())
    const user = userEvent.setup()
    setup()

    const summary = await screen.findByLabelText('Professional summary')
    fireEvent.change(summary, { target: { value: 'Rewritten summary.' } })

    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeEnabled()
    await user.click(save)

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    expect(update.mock.calls[0][1].content?.summary).toBe('Rewritten summary.')
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('saves a title-only change without a content payload', async () => {
    update.mockResolvedValue(cvResponse({ title: 'Renamed CV' }))
    const user = userEvent.setup()
    setup()

    const titleInput = await screen.findByLabelText('CV title')
    fireEvent.change(titleInput, { target: { value: 'Renamed CV' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    const payload = update.mock.calls[0][1]
    expect(payload.title).toBe('Renamed CV')
    expect(payload).not.toHaveProperty('content')
  })

  it('downloads the PDF', async () => {
    downloadPdf.mockResolvedValue({ blob: new Blob(['%PDF']), filename: 'Backend-CV.pdf' })
    const user = userEvent.setup()
    setup()

    await user.click(await screen.findByRole('button', { name: /download pdf/i }))
    await waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(5, 'Backend CV.pdf'))
    expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'Backend-CV.pdf')
  })

  it('restores an older version', async () => {
    restoreVersion.mockResolvedValue(cvResponse({ current_version_number: 3 }))
    const user = userEvent.setup()
    setup()

    // Version history is a <details> — open it first.
    await user.click(await screen.findByText(/version history/i))
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    await waitFor(() => expect(restoreVersion).toHaveBeenCalledWith(5, 1))
  })
})
