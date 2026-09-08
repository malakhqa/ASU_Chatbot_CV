import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from './api'
import { jobService } from './jobService'

vi.mock('./api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))
const get = vi.mocked(api.get)
const post = vi.mocked(api.post)
const del = vi.mocked(api.delete)

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  del.mockReset()
})

describe('jobService', () => {
  it('list -> GET /jobs', async () => {
    get.mockResolvedValue({ data: [] })
    await jobService.list()
    expect(get).toHaveBeenCalledWith('/jobs')
  })

  it('create -> POST /jobs', async () => {
    post.mockResolvedValue({ data: { id: 3 } })
    await jobService.create({ title: 'Dev', description: 'stuff' })
    expect(post).toHaveBeenCalledWith('/jobs', { title: 'Dev', description: 'stuff' })
  })

  it('remove -> DELETE /jobs/:id', async () => {
    del.mockResolvedValue({})
    await jobService.remove(9)
    expect(del).toHaveBeenCalledWith('/jobs/9')
  })

  it('customize -> POST /jobs/customize', async () => {
    post.mockResolvedValue({ data: { id: 1 } })
    await jobService.customize({ cv_id: 1, job_description_id: 2 })
    expect(post).toHaveBeenCalledWith('/jobs/customize', { cv_id: 1, job_description_id: 2 })
  })
})
