import { TagsInput } from '@/components/common'
import { Section } from './Section'

export interface SkillsFormProps {
  value: string[]
  onChange: (next: string[]) => void
}

export function SkillsForm({ value, onChange }: SkillsFormProps) {
  return (
    <Section title="Skills" description="Press Enter or comma to add each skill.">
      <TagsInput
        label="Skills"
        value={value}
        onChange={onChange}
        placeholder="e.g. Python, FastAPI, SQL"
      />
    </Section>
  )
}
