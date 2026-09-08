import { Input, RepeatableList, TagsInput, TextArea } from '@/components/common'
import type { ProjectItem } from '@/types'
import { Section } from './Section'

export interface ProjectsFormProps {
  value: ProjectItem[]
  onChange: (next: ProjectItem[]) => void
}

export function ProjectsForm({ value, onChange }: ProjectsFormProps) {
  return (
    <Section title="Projects" description="University, personal, or research projects.">
      <RepeatableList<ProjectItem>
        items={value}
        onChange={onChange}
        makeEmpty={() => ({ technologies: [], highlights: [] })}
        addLabel="Add project"
        emptyHint="No projects added yet."
        renderItem={(item, update) => (
          <>
            <div className="grid-2">
              <Input
                label="Name"
                value={item.name ?? ''}
                onChange={(e) => update({ name: e.target.value })}
              />
              <Input
                label="Link"
                value={item.link ?? ''}
                onChange={(e) => update({ link: e.target.value })}
              />
            </div>
            <TextArea
              label="Description"
              rows={2}
              value={item.description ?? ''}
              onChange={(e) => update({ description: e.target.value })}
            />
            <TagsInput
              label="Technologies"
              value={item.technologies ?? []}
              onChange={(technologies) => update({ technologies })}
            />
            <TagsInput
              label="Highlights"
              value={item.highlights ?? []}
              onChange={(highlights) => update({ highlights })}
            />
          </>
        )}
      />
    </Section>
  )
}
