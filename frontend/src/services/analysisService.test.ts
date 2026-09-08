import { beforeEach, describe, expect, it, vi } from 'vitest'

import { analysisService } from './analysisService'
import { api } from './api'

vi.mock('./api', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
const get = vi.mocked(api.get)
const post = vi.mocked(api.post)

beforeEach(() => {
  get.mockReset()
  post.mockReset()
})

describe('analysisService', () => {
  it('analyze -> POST /cv/analyze', async () => {
    post.mockResolvedValue({ data: { id: 1 } })
    await analysisService.analyze({ cv_id: 7 })
    expect(post).toHaveBeenCalledWith('/cv/analyze', { cv_id: 7 })
  })

  it('listForCv -> GET /cv/:id/analyses', async () => {
    get.mockResolvedValue({ data: [] })
    await analysisService.listForCv(7)
    expect(get).toHaveBeenCalledWith('/cv/7/analyses')
  })
})
