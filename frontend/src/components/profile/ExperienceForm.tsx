import { Input, RepeatableList, TagsInput, TextArea } from '@/components/common'
import type { ExperienceItem } from '@/types'
import { Section } from './Section'

export interface ExperienceFormProps {
  value: ExperienceItem[]
  onChange: (next: ExperienceItem[]) => void
}

export function ExperienceForm({ value, onChange }: ExperienceFormProps) {
  return (
    <Section
      title="Experience"
      description="Internships, part-time roles, volunteering — anything relevant."
    >
      <RepeatableList<ExperienceItem>
        items={value}
        onChange={onChange}
        makeEmpty={() => ({ current: false, highlights: [] })}
        addLabel="Add experience"
        emptyHint="No experience added yet."
        renderItem={(item, update) => (
          <>
            <div className="grid-2">
              <Input
                label="Title"
                value={item.title ?? ''}
                onChange={(e) => update({ title: e.target.value })}
              />
              <Input
                label="Company"
                value={item.company ?? ''}
                onChange={(e) => update({ company: e.target.value })}
              />
              <Input
                label="Location"
                value={item.location ?? ''}
                onChange={(e) => update({ location: e.target.value })}
              />
              <Input
                label="Start"
                placeholder="Jun 2024"
                value={item.start_date ?? ''}
                onChange={(e) => update({ start_date: e.target.value })}
              />
              <Input
                label="End"
                placeholder="Sep 2024"
                value={item.end_date ?? ''}
                onChange={(e) => update({ end_date: e.target.value })}
                disabled={item.current}
              />
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={item.current ?? false}
                onChange={(e) => update({ current: e.target.checked })}
              />
              I currently work here
            </label>
            <TextArea
              label="Description"
              rows={2}
              value={item.description ?? ''}
              onChange={(e) => update({ description: e.target.value })}
            />
            <TagsInput
              label="Highlights"
              value={item.highlights ?? []}
              onChange={(highlights) => update({ highlights })}
              placeholder="One achievement per entry"
            />
          </>
        )}
      />
    </Section>
  )
}
