import { Input } from '@/components/common'
import { Section } from '@/components/profile/Section'
import type { CVPersonalInfo } from '@/types'

const FIELDS = [
  ['full_name', 'Full name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['location', 'Location'],
  ['linkedin', 'LinkedIn'],
  ['github', 'GitHub'],
  ['website', 'Website'],
] as const

type Key = (typeof FIELDS)[number][0]

export interface CVPersonalInfoFormProps {
  value: CVPersonalInfo
  onChange: (next: CVPersonalInfo) => void
}

export function CVPersonalInfoForm({ value, onChange }: CVPersonalInfoFormProps) {
  const set = (key: Key, raw: string) => onChange({ ...value, [key]: raw || null })

  return (
    <Section title="Personal information">
      <div className="grid-2">
        {FIELDS.map(([key, label]) => (
          <Input
            key={key}
            label={label}
            type={key === 'email' ? 'email' : 'text'}
            value={value[key] ?? ''}
            onChange={(e) => set(key, e.target.value)}
          />
        ))}
      </div>
    </Section>
  )
}
