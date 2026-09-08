import { useId, useState, type KeyboardEvent } from 'react'

export interface TagsInputProps {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

/** Chip input: Enter or comma adds; Backspace on empty removes the last. */
export function TagsInput({ label, value, onChange, placeholder }: TagsInputProps) {
  const [draft, setDraft] = useState('')
  const inputId = useId()

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, '').trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index))

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeAt(value.length - 1)
    }
  }

  return (
    <div className="field">
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <div className="tags">
        {value.map((tag, i) => (
          <span key={`${tag}-${i}`} className="tags__chip">
            {tag}
            <button
              type="button"
              className="tags__remove"
              aria-label={`Remove ${tag}`}
              onClick={() => removeAt(i)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          className="tags__input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && add(draft)}
        />
      </div>
    </div>
  )
}
