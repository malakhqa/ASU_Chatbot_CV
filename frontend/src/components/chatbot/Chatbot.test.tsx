import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { chatService } from '@/services/chatService'
import type { ChatMessage, ChatSendResponse } from '@/types'

import { Chatbot } from './Chatbot'

vi.mock('@/services/chatService', () => ({
  chatService: {
    sendMessage: vi.fn(),
    getConversation: vi.fn(),
    listConversations: vi.fn(),
    deleteConversation: vi.fn(),
  },
}))
const sendMessage = vi.mocked(chatService.sendMessage)

const assistantMsg = (content: string): ChatMessage => ({
  id: 99,
  role: 'assistant',
  content,
  action: null,
  created_at: '2026-01-01T00:00:00Z',
})

const reply = (over: Partial<ChatSendResponse> = {}): ChatSendResponse => ({
  conversation_id: 1,
  message: assistantMsg('Here to help.'),
  proposed_action: null,
  applied: false,
  cv_version_number: null,
  ...over,
})

afterEach(() => sendMessage.mockClear())

describe('<Chatbot />', () => {
  it('shows the optimistic user message and the assistant reply', async () => {
    sendMessage.mockResolvedValue(reply({ message: assistantMsg('Try active verbs.') }))
    const user = userEvent.setup()
    render(<Chatbot />)

    await user.type(screen.getByLabelText('Message'), 'improve my summary{Enter}')

    expect(screen.getByText('improve my summary')).toBeInTheDocument()
    expect(await screen.findByText('Try active verbs.')).toBeInTheDocument()
    expect(sendMessage).toHaveBeenCalledWith({
      message: 'improve my summary',
      conversation_id: undefined,
      cv_id: undefined,
    })
  })

  it('reports an applied CV edit and calls onCvUpdated', async () => {
    const onCvUpdated = vi.fn()
    sendMessage.mockResolvedValue(
      reply({
        message: assistantMsg('Added Python.'),
        proposed_action: { type: 'cv_update', section: 'skills', action: 'add', content: 'Python' },
        applied: true,
        cv_version_number: 3,
      }),
    )
    const user = userEvent.setup()
    render(<Chatbot cvId={5} onCvUpdated={onCvUpdated} />)

    await user.type(screen.getByLabelText('Message'), 'add python to my skills{Enter}')

    expect(await screen.findByText(/CV updated/)).toBeInTheDocument()
    await waitFor(() => expect(onCvUpdated).toHaveBeenCalledWith(3))
    expect(sendMessage).toHaveBeenCalledWith({
      message: 'add python to my skills',
      conversation_id: undefined,
      cv_id: 5,
    })
  })

  it('rolls back the optimistic message on error', async () => {
    sendMessage.mockRejectedValue(new Error('AI service is not configured'))
    const user = userEvent.setup()
    render(<Chatbot />)

    await user.type(screen.getByLabelText('Message'), 'hello{Enter}')
    await new Promise((r) => setTimeout(r, 300))

    expect(screen.getByRole('alert')).toHaveTextContent(/not configured/i)
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
  })
})
