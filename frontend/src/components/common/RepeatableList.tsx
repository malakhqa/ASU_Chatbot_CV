import type { ReactNode } from 'react'

import { Button } from './Button'

export interface RepeatableListProps<T> {
  items: T[]
  onChange: (next: T[]) => void
  makeEmpty: () => T
  addLabel: string
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode
  emptyHint?: string
}

/** Generic add / remove list of form rows. */
export function RepeatableList<T>({
  items,
  onChange,
  makeEmpty,
  addLabel,
  renderItem,
  emptyHint,
}: RepeatableListProps<T>) {
  const updateAt = (index: number, patch: Partial<T>) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))

  const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index))

  return (
    <div className="repeatable">
      {items.length === 0 && emptyHint ? <p className="muted">{emptyHint}</p> : null}

      {items.map((item, index) => (
        <div key={index} className="repeatable__row">
          <div className="repeatable__fields">
            {renderItem(item, (patch) => updateAt(index, patch), index)}
          </div>
          <button
            type="button"
            className="repeatable__remove"
            aria-label="Remove"
            onClick={() => removeAt(index)}
          >
            Remove
          </button>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={() => onChange([...items, makeEmpty()])}>
        {addLabel}
      </Button>
    </div>
  )
}
