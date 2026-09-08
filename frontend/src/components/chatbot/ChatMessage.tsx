import type { ChatMessage as ChatMessageT } from '@/types'

export interface ChatMessageProps {
  message: ChatMessageT
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'system') {
    return <p className="chat-msg chat-msg--system">{message.content}</p>
  }
  return (
    <div className={`chat-msg chat-msg--${message.role}`}>
      <div className="chat-msg__bubble">{message.content}</div>
    </div>
  )
}
