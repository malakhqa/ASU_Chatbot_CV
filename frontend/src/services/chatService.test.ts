import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from './api'
import { chatService } from './chatService'

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

describe('chatService', () => {
  it('sendMessage -> POST /chat/message', async () => {
    post.mockResolvedValue({ data: {} })
    await chatService.sendMessage({ message: 'hi', cv_id: 3 })
    expect(post).toHaveBeenCalledWith('/chat/message', { message: 'hi', cv_id: 3 })
  })

  it('listConversations -> GET /chat/conversations', async () => {
    get.mockResolvedValue({ data: [] })
    await chatService.listConversations()
    expect(get).toHaveBeenCalledWith('/chat/conversations')
  })

  it('getConversation -> GET /chat/conversations/:id', async () => {
    get.mockResolvedValue({ data: {} })
    await chatService.getConversation(7)
    expect(get).toHaveBeenCalledWith('/chat/conversations/7')
  })

  it('deleteConversation -> DELETE /chat/conversations/:id', async () => {
    del.mockResolvedValue({})
    await chatService.deleteConversation(7)
    expect(del).toHaveBeenCalledWith('/chat/conversations/7')
  })
})
