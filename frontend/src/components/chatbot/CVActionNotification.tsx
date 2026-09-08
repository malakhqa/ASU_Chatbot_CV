import type { ChatActionState } from '@/hooks/useChat'

function describe(action: ChatActionState['action']): string {
  const { action: verb, section, content } = action
  const value =
    typeof content === 'string'
      ? ` “${content}”`
      : Array.isArray(content)
        ? ` (${content.length} items)`
        : ''
  return `${verb} ${section}${value}`
}

export interface CVActionNotificationProps {
  state: ChatActionState
}

export function CVActionNotification({ state }: CVActionNotificationProps) {
  const summary = describe(state.action)

  if (state.applied) {
    return (
      <div className="cv-action cv-action--applied" role="status">
        <strong>CV updated</strong> — {summary}
        {state.versionNumber != null ? ` · now v${state.versionNumber}` : ''}
      </div>
    )
  }

  return (
    <div className="cv-action cv-action--proposed" role="status">
      <strong>Suggested change</strong> — {summary}. Open this chat from a CV editor to apply
      changes automatically.
    </div>
  )
}
