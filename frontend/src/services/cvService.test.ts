import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from './api'
import { cvService } from './cvService'

vi.mock('./api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
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
})
