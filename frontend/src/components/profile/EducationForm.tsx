import { Input, RepeatableList, TextArea } from '@/components/common'
import type { EducationItem } from '@/types'
import { Section } from './Section'

export interface EducationFormProps {
  value: EducationItem[]
  onChange: (next: EducationItem[]) => void
}

export function EducationForm({ value, onChange }: EducationFormProps) {
  return (
    <Section title="Education">
      <RepeatableList<EducationItem>
        items={value}
        onChange={onChange}
        makeEmpty={() => ({})}
        addLabel="Add education"
        emptyHint="No education added yet."
        renderItem={(item, update) => (
          <>
            <div className="grid-2">
              <Input
                label="Institution"
                value={item.institution ?? ''}
                onChange={(e) => update({ institution: e.target.value })}
              />
              <Input
                label="Degree"
                value={item.degree ?? ''}
                onChange={(e) => update({ degree: e.target.value })}
              />
              <Input
                label="Field of study"
                value={item.field_of_study ?? ''}
                onChange={(e) => update({ field_of_study: e.target.value })}
              />
              <Input
                label="GPA"
                value={item.gpa ?? ''}
                onChange={(e) => update({ gpa: e.target.value })}
              />
              <Input
                label="Start"
                placeholder="2021"
                value={item.start_date ?? ''}
                onChange={(e) => update({ start_date: e.target.value })}
              />
              <Input
                label="End"
                placeholder="2025 or Present"
                value={item.end_date ?? ''}
                onChange={(e) => update({ end_date: e.target.value })}
              />
            </div>
            <TextArea
              label="Notes"
              rows={2}
              value={item.description ?? ''}
              onChange={(e) => update({ description: e.target.value })}
            />
          </>
        )}
      />
    </Section>
  )
}
