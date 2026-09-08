import { Input, TextArea } from '@/components/common'
import type { ProfileFields } from '@/types'
import { Section } from './Section'

const SCALARS = [
  ['full_name', 'Full name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['location', 'Location'],
  ['linkedin', 'LinkedIn'],
  ['github', 'GitHub'],
  ['website', 'Website'],
] as const

type ScalarKey = (typeof SCALARS)[number][0]

export interface PersonalInfoFormProps {
  value: ProfileFields
  onChange: (patch: Partial<ProfileFields>) => void
  emailError?: string
}

export function PersonalInfoForm({ value, onChange, emailError }: PersonalInfoFormProps) {
  const set = (key: ScalarKey) => (raw: string) =>
    onChange({ [key]: raw ? raw : null } as Partial<ProfileFields>)

  return (
    <Section
      title="Personal information"
      description="Contact details and your professional summary."
    >
      <div className="grid-2">
        {SCALARS.map(([key, label]) => (
          <Input
            key={key}
            label={label}
            type={key === 'email' ? 'email' : 'text'}
            value={value[key] ?? ''}
            onChange={(e) => set(key)(e.target.value)}
            error={key === 'email' ? emailError : undefined}
          />
        ))}
      </div>
      <TextArea
        label="Professional summary"
        value={value.summary ?? ''}
        onChange={(e) => onChange({ summary: e.target.value ? e.target.value : null })}
      />
    </Section>
  )
}
