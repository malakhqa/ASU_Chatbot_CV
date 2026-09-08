import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from './api'
import { cvService } from './cvService'

vi.mock('./api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))
vi.mock('@/lib/download', () => ({
  filenameFromDisposition: (_h: string | undefined, fallback: string) => fallback,
}))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)
const put = vi.mocked(api.put)

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  put.mockReset()
})

describe('cvService', () => {
  it('list -> GET /cv', async () => {
    get.mockResolvedValue({ data: [{ id: 1 }] })
    await expect(cvService.list()).resolves.toEqual([{ id: 1 }])
    expect(get).toHaveBeenCalledWith('/cv')
  })

  it('get -> GET /cv/:id', async () => {
    get.mockResolvedValue({ data: { id: 5 } })
    await cvService.get(5)
    expect(get).toHaveBeenCalledWith('/cv/5')
  })

  it('create -> POST /cv', async () => {
    post.mockResolvedValue({ data: { id: 9 } })
    await cvService.create({ title: 'X', template: 'modern' })
    expect(post).toHaveBeenCalledWith('/cv', { title: 'X', template: 'modern' })
  })

  it('generate -> POST /cv/generate', async () => {
    post.mockResolvedValue({ data: { id: 9 } })
    await cvService.generate({ title: 'X' })
    expect(post).toHaveBeenCalledWith('/cv/generate', { title: 'X' })
  })

  it('update -> PUT /cv/:id', async () => {
    put.mockResolvedValue({ data: { id: 3 } })
    await cvService.update(3, { title: 'New' })
    expect(put).toHaveBeenCalledWith('/cv/3', { title: 'New' })
  })

  it('listVersions -> GET /cv/:id/versions', async () => {
    get.mockResolvedValue({ data: [] })
    await cvService.listVersions(4)
    expect(get).toHaveBeenCalledWith('/cv/4/versions')
  })

  it('restoreVersion -> POST /cv/:id/versions/:n/restore', async () => {
    post.mockResolvedValue({ data: { id: 4 } })
    await cvService.restoreVersion(4, 2)
    expect(post).toHaveBeenCalledWith('/cv/4/versions/2/restore')
  })

  it('downloadPdf -> GET /cv/:id/pdf as a blob', async () => {
    const blob = new Blob(['%PDF'])
    get.mockResolvedValue({ data: blob, headers: {} })
    const out = await cvService.downloadPdf(6, 'my.pdf')
    expect(get).toHaveBeenCalledWith('/cv/6/pdf', { responseType: 'blob' })
    expect(out).toEqual({ blob, filename: 'my.pdf' })
  })
})
