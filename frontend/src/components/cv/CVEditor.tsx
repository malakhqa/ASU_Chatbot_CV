import { TextArea } from '@/components/common'
import {
  CertificationsForm,
  EducationForm,
  ExperienceForm,
  LanguagesForm,
  ProjectsForm,
  SkillsForm,
} from '@/components/profile'
import { Section } from '@/components/profile/Section'
import type { CVContent } from '@/types'

import { CVPersonalInfoForm } from './CVPersonalInfoForm'

export interface CVEditorProps {
  content: CVContent
  onChange: (patch: Partial<CVContent>) => void
}

// The section forms are shared with the profile editor — same item shapes.
export function CVEditor({ content, onChange }: CVEditorProps) {
  return (
    <div className="cv-editor">
      <CVPersonalInfoForm
        value={content.personal_info}
        onChange={(personal_info) => onChange({ personal_info })}
      />

      <Section title="Summary">
        <TextArea
          label="Professional summary"
          value={content.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
        />
      </Section>

      <ExperienceForm
        value={content.experience}
        onChange={(experience) => onChange({ experience })}
      />
      <EducationForm value={content.education} onChange={(education) => onChange({ education })} />
      <ProjectsForm value={content.projects} onChange={(projects) => onChange({ projects })} />
      <SkillsForm value={content.skills} onChange={(skills) => onChange({ skills })} />
      <CertificationsForm
        value={content.certifications}
        onChange={(certifications) => onChange({ certifications })}
      />
      <LanguagesForm value={content.languages} onChange={(languages) => onChange({ languages })} />
    </div>
  )
}
