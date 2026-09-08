import { Select } from '@/components/common'
import { CV_TEMPLATES, templateLabel } from '@/lib/cv'

const OPTIONS = CV_TEMPLATES.map((t) => ({ value: t, label: templateLabel(t) }))

export interface TemplateSelectorProps {
  value: string
  onChange: (template: string) => void
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <Select
      label="Template"
      options={OPTIONS}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
