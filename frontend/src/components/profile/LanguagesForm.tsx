import { Input, RepeatableList } from '@/components/common'
import type { LanguageItem } from '@/types'
import { Section } from './Section'

export interface LanguagesFormProps {
  value: LanguageItem[]
  onChange: (next: LanguageItem[]) => void
}

export function LanguagesForm({ value, onChange }: LanguagesFormProps) {
  return (
    <Section title="Languages">
      <RepeatableList<LanguageItem>
        items={value}
        onChange={onChange}
        makeEmpty={() => ({ name: '' })}
        addLabel="Add language"
        emptyHint="No languages added yet."
        renderItem={(item, update) => (
          <div className="grid-2">
            <Input
              label="Language"
              value={item.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <Input
              label="Proficiency"
              placeholder="e.g. Fluent, Native"
              value={item.proficiency ?? ''}
              onChange={(e) => update({ proficiency: e.target.value })}
            />
          </div>
        )}
      />
    </Section>
  )
}
