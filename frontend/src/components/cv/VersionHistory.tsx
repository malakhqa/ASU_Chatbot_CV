import { Button } from '@/components/common'
import { formatDate } from '@/lib/format'
import type { CVVersion } from '@/types'

const SOURCE_LABEL: Record<string, string> = {
  generated: 'AI generated',
  manual_edit: 'Manual edit',
  job_customization: 'Job customization',
  chat_edit: 'Chat edit',
  restore: 'Restored',
}

export interface VersionHistoryProps {
  versions: CVVersion[]
  currentNumber: number | null
  restoringNumber: number | null
  onRestore: (versionNumber: number) => void
}

export function VersionHistory({
  versions,
  currentNumber,
  restoringNumber,
  onRestore,
}: VersionHistoryProps) {
  return (
    <details className="version-history">
      <summary>Version history ({versions.length})</summary>
      <ul>
        {versions.map((v) => {
          const isCurrent = v.version_number === currentNumber
          return (
            <li key={v.id} className="version-history__row">
              <div>
                <strong>v{v.version_number}</strong>{' '}
                <span className="muted">
                  {SOURCE_LABEL[v.source] ?? v.source} · {formatDate(v.created_at)}
                </span>
                {v.note ? <div className="muted">{v.note}</div> : null}
              </div>
              {isCurrent ? (
                <span className="badge">current</span>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => onRestore(v.version_number)}
                  loading={restoringNumber === v.version_number}
                  disabled={restoringNumber !== null}
                >
                  Restore
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </details>
  )
}
