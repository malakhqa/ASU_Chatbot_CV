import { Input, RepeatableList } from '@/components/common'
import type { CertificationItem } from '@/types'
import { Section } from './Section'

export interface CertificationsFormProps {
  value: CertificationItem[]
  onChange: (next: CertificationItem[]) => void
}

export function CertificationsForm({ value, onChange }: CertificationsFormProps) {
  return (
    <Section title="Certifications & courses">
      <RepeatableList<CertificationItem>
        items={value}
        onChange={onChange}
        makeEmpty={() => ({})}
        addLabel="Add certification"
        emptyHint="No certifications added yet."
        renderItem={(item, update) => (
          <div className="grid-2">
            <Input
              label="Name"
              value={item.name ?? ''}
              onChange={(e) => update({ name: e.target.value })}
            />
            <Input
              label="Issuer"
              value={item.issuer ?? ''}
              onChange={(e) => update({ issuer: e.target.value })}
            />
            <Input
              label="Issue date"
              placeholder="2024"
              value={item.issue_date ?? ''}
              onChange={(e) => update({ issue_date: e.target.value })}
            />
            <Input
              label="Credential ID"
              value={item.credential_id ?? ''}
              onChange={(e) => update({ credential_id: e.target.value })}
            />
            <Input
              label="Link"
              value={item.link ?? ''}
              onChange={(e) => update({ link: e.target.value })}
            />
          </div>
        )}
      />
    </Section>
  )
}
