import { afterEach, describe, expect, it, vi } from 'vitest'

import { filenameFromDisposition, saveBlob } from './download'

describe('filenameFromDisposition', () => {
  it('reads a quoted filename', () => {
    expect(filenameFromDisposition('attachment; filename="Backend-CV.pdf"', 'x.pdf')).toBe(
      'Backend-CV.pdf',
    )
  })
  it('reads an unquoted filename', () => {
    expect(filenameFromDisposition('attachment; filename=cv.pdf', 'x.pdf')).toBe('cv.pdf')
  })
  it('falls back when absent', () => {
    expect(filenameFromDisposition(undefined, 'fallback.pdf')).toBe('fallback.pdf')
  })
})

describe('saveBlob', () => {
  afterEach(() => vi.restoreAllMocks())

  it('creates an object URL, clicks an anchor, and revokes', () => {
    const createURL = vi.fn(() => 'blob:mock')
    const revokeURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: createURL, revokeObjectURL: revokeURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    saveBlob(new Blob(['hi']), 'file.pdf')

    expect(createURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeURL).toHaveBeenCalledWith('blob:mock')
    expect(document.querySelector('a')).toBeNull() // anchor removed
  })
})
