import { useCallback, useEffect, useRef, useState } from 'react'

import { chatService } from '@/services/chatService'
import type { ChatMessage, ChatSendResponse, CVAction } from '@/types'

export interface ChatActionState {
  action: CVAction
  applied: boolean
  versionNumber: number | null
}

export interface UseChat {
  messages: ChatMessage[]
  conversationId: number | undefined
  loading: boolean
  sending: boolean
  error: unknown
  lastAction: ChatActionState | null
  send: (text: string) => Promise<ChatSendResponse | null>
}

let tempId = -1

export function useChat(conversationId: number | undefined, cvId?: number): UseChat {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeId, setActiveId] = useState<number | undefined>(conversationId)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [lastAction, setLastAction] = useState<ChatActionState | null>(null)
  const sendingRef = useRef(false)

  useEffect(() => {
    setActiveId(conversationId)
    setLastAction(null)
    setError(null)
    if (conversationId == null) {
      setMessages([])
      return
    }
    let cancelled = false
    setLoading(true)
    chatService
      .getConversation(conversationId)
      .then((c) => {
        if (cancelled) return
        setMessages(c.messages)
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [conversationId])

  const send = useCallback(
    async (text: string): Promise<ChatSendResponse | null> => {
      const body = text.trim()
      if (!body || sendingRef.current) return null

      const optimistic: ChatMessage = {
        id: tempId--,
        role: 'user',
        content: body,
        action: null,
        created_at: new Date().toISOString(),
      }
      setMessages((m) => [...m, optimistic])
      sendingRef.current = true
      setSending(true)
      setError(null)

      try {
        const res = await chatService.sendMessage({
          message: body,
          conversation_id: activeId,
          cv_id: cvId,
        })
        setActiveId(res.conversation_id)
        setMessages((m) => [...m, res.message])
        setLastAction(
          res.proposed_action
            ? {
                action: res.proposed_action,
                applied: res.applied,
                versionNumber: res.cv_version_number,
              }
            : null,
        )
        return res
      } catch (e) {
        setError(e)
        setMessages((m) => m.filter((x) => x.id !== optimistic.id))
        return null
      } finally {
        sendingRef.current = false
        setSending(false)
      }
    },
    [activeId, cvId],
  )

  return { messages, conversationId: activeId, loading, sending, error, lastAction, send }
}
