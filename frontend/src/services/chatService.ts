import type {
  ChatSendRequest,
  ChatSendResponse,
  ConversationResponse,
  ConversationSummary,
} from '@/types'
import { api } from './api'

export const chatService = {
  async sendMessage(payload: ChatSendRequest): Promise<ChatSendResponse> {
    const { data } = await api.post<ChatSendResponse>('/chat/message', payload)
    return data
  },

  async listConversations(): Promise<ConversationSummary[]> {
    const { data } = await api.get<ConversationSummary[]>('/chat/conversations')
    return data
  },

  async getConversation(id: number): Promise<ConversationResponse> {
    const { data } = await api.get<ConversationResponse>(`/chat/conversations/${id}`)
    return data
  },

  async deleteConversation(id: number): Promise<void> {
    await api.delete(`/chat/conversations/${id}`)
  },
}
