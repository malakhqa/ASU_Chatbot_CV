import { useEffect, useRef } from 'react'

import { ErrorMessage, Loading } from '@/components/common'
import { useChat } from '@/hooks/useChat'

import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { CVActionNotification } from './CVActionNotification'

export interface ChatbotProps {
  /** When set, CV edit actions from the assistant auto-apply to this CV. */
  cvId?: number
  conversationId?: number
  onConversationChange?: (id: number) => void
  onCvUpdated?: (versionNumber: number) => void
}

export function Chatbot({ cvId, conversationId, onConversationChange, onCvUpdated }: ChatbotProps) {
  const { messages, loading, sending, error, lastAction, send } = useChat(conversationId, cvId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending])

  const handleSend = async (text: string) => {
    const res = await send(text)
    if (!res) return
    if (res.conversation_id !== conversationId) onConversationChange?.(res.conversation_id)
    if (res.applied && res.cv_version_number != null) onCvUpdated?.(res.cv_version_number)
  }

  return (
    <div className="chatbot">
      <div className="chatbot__log" ref={scrollRef}>
        {loading ? (
          <Loading label="Loading conversation…" />
        ) : messages.length === 0 ? (
          <p className="muted chatbot__empty">
            Ask me anything about your career or CV — for example “make my summary more concise” or
            “what skills am I missing for a backend role?”.
          </p>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} />)
        )}
        {sending ? <div className="chat-msg chat-msg--assistant chat-msg--typing">…</div> : null}
      </div>

      {lastAction ? <CVActionNotification state={lastAction} /> : null}
      <ErrorMessage error={error} />

      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  )
}
