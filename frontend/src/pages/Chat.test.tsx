import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { chatService } from '@/services/chatService'
import type { ConversationResponse, ConversationSummary } from '@/types'

import Chat from './Chat'

vi.mock('@/services/chatService', () => ({
  chatService: {
    sendMessage: vi.fn(),
    getConversation: vi.fn(),
    listConversations: vi.fn(),
    deleteConversation: vi.fn(),
  },
}))
const listConversations = vi.mocked(chatService.listConversations)
const getConversation = vi.mocked(chatService.getConversation)
const deleteConversation = vi.mocked(chatService.deleteConversation)

const summary = (id: number, title: string): ConversationSummary => ({
  id,
  title,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
})

beforeEach(() => {
  vi.clearAllMocks()
  listConversations.mockResolvedValue([summary(1, 'CV help'), summary(2, 'Career questions')])
  getConversation.mockResolvedValue({
    ...summary(1, 'CV help'),
    messages: [
      { id: 10, role: 'user', content: 'how do I improve?', action: null, created_at: 'x' },
      { id: 11, role: 'assistant', content: 'Add metrics.', action: null, created_at: 'x' },
    ],
  } satisfies ConversationResponse)
})

function setup() {
  return render(
    <MemoryRouter>
      <Chat />
    </MemoryRouter>,
  )
}

describe('<Chat /> page', () => {
  it('lists conversations and loads one when selected', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(await screen.findByText('CV help'))

    await waitFor(() => expect(getConversation).toHaveBeenCalledWith(1))
    expect(await screen.findByText('Add metrics.')).toBeInTheDocument()
  })

  it('deletes a conversation', async () => {
    deleteConversation.mockResolvedValue()
    const user = userEvent.setup()
    setup()

    await user.click(await screen.findByRole('button', { name: /delete CV help/i }))
    expect(deleteConversation).toHaveBeenCalledWith(1)
  })

  it('shows the empty prompt for a new chat', async () => {
    setup()
    expect(await screen.findByText(/ask me anything about your career/i)).toBeInTheDocument()
  })
})
