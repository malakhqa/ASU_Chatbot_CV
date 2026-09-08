import { Input, RepeatableList, TextArea } from '@/components/common'
import type { AwardItem } from '@/types'
import { Section } from './Section'

export interface AwardsFormProps {
  value: AwardItem[]
  onChange: (next: AwardItem[]) => void
}

export function AwardsForm({ value, onChange }: AwardsFormProps) {
  return (
    <Section title="Awards & achievements">
      <RepeatableList<AwardItem>
        items={value}
        onChange={onChange}
        makeEmpty={() => ({ title: '' })}
        addLabel="Add award"
        emptyHint="No awards added yet."
        renderItem={(item, update) => (
          <>
            <div className="grid-2">
              <Input
                label="Title"
                value={item.title}
                onChange={(e) => update({ title: e.target.value })}
              />
              <Input
                label="Issuer"
                value={item.issuer ?? ''}
                onChange={(e) => update({ issuer: e.target.value })}
              />
              <Input
                label="Date"
                placeholder="2023"
                value={item.date ?? ''}
                onChange={(e) => update({ date: e.target.value })}
              />
            </div>
            <TextArea
              label="Description"
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
