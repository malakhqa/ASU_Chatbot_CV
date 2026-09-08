import { Button } from '@/components/common'

export interface CVActionsProps {
  dirty: boolean
  saving: boolean
  downloading: boolean
  saved: boolean
  onSave: () => void
  onDownload: () => void
}

export function CVActions({
  dirty,
  saving,
  downloading,
  saved,
  onSave,
  onDownload,
}: CVActionsProps) {
  return (
    <div className="cv-actions">
      {saved && !dirty ? <span className="badge badge--ok">Saved</span> : null}
      <Button onClick={onSave} loading={saving} disabled={!dirty}>
        Save
      </Button>
      <Button
        variant="secondary"
        onClick={onDownload}
        loading={downloading}
        disabled={dirty}
        title={dirty ? 'Save your changes first' : undefined}
      >
        Download PDF
      </Button>
    </div>
  )
}
