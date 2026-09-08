import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/common'
import { Chatbot } from '@/components/chatbot'
import { formatDate } from '@/lib/format'
import { chatService } from '@/services/chatService'
import type { ConversationSummary } from '@/types'

export default function Chat() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined)

  const reloadList = useCallback(() => {
    chatService
      .listConversations()
      .then(setConversations)
      .catch(() => setConversations([]))
  }, [])

  useEffect(reloadList, [reloadList])

  const handleConversationChange = (id: number) => {
    setSelectedId(id)
    reloadList()
  }

  const handleDelete = async (id: number) => {
    await chatService.deleteConversation(id).catch(() => {})
    if (selectedId === id) setSelectedId(undefined)
    reloadList()
  }

  return (
    <section className="page chat-page">
      <aside className="chat-page__sidebar">
        <Button variant="secondary" onClick={() => setSelectedId(undefined)}>
          New chat
        </Button>
        <ul>
          {conversations.map((c) => (
            <li key={c.id} className={c.id === selectedId ? 'chat-conv is-active' : 'chat-conv'}>
              <button className="chat-conv__open" onClick={() => setSelectedId(c.id)}>
                <span className="chat-conv__title">{c.title || 'Untitled chat'}</span>
                <span className="muted">{formatDate(c.updated_at)}</span>
              </button>
              <button
                className="chat-conv__delete"
                aria-label={`Delete ${c.title || 'chat'}`}
                onClick={() => handleDelete(c.id)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="chat-page__main">
        <h1>AI Career Assistant</h1>
        <Chatbot
          key={selectedId ?? 'new'}
          conversationId={selectedId}
          onConversationChange={handleConversationChange}
        />
      </div>
    </section>
  )
}
