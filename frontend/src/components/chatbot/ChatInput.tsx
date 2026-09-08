import { useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/common'

export interface ChatInputProps {
  onSend: (text: string) => void | Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')

  const submit = () => {
    const body = text.trim()
    if (!body || disabled) return
    void Promise.resolve(onSend(body)).catch(() => {})
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="chat-input">
      <textarea
        className="chat-input__field"
        rows={2}
        placeholder="Ask about your CV or career… (Enter to send, Shift+Enter for a new line)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Message"
      />
      <Button onClick={submit} disabled={disabled || !text.trim()}>
        Send
      </Button>
    </div>
  )
}
