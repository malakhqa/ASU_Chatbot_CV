import { useEffect, useMemo, useState } from 'react'

import { Button, ErrorMessage, Loading } from '@/components/common'
import {
  AwardsForm,
  CertificationsForm,
  EducationForm,
  ExperienceForm,
  LanguagesForm,
  PersonalInfoForm,
  ProjectsForm,
  SkillsForm,
} from '@/components/profile'
import { useProfile } from '@/hooks/useProfile'
import { cleanProfilePayload, isDirty, toFields } from '@/lib/profile'
import { validateEmailOptional } from '@/lib/validation'
import { profileService } from '@/services/profileService'
import type { ProfileFields } from '@/types'

export default function Profile() {
  const { profile, status, error, setProfile } = useProfile()
  const [form, setForm] = useState<ProfileFields | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) setForm(toFields(profile))
  }, [profile])

  const pristine = useMemo(() => (profile ? toFields(profile) : null), [profile])
  const dirty = form && pristine ? isDirty(form, pristine) : false
  const emailError = form ? validateEmailOptional(form.email) : undefined

  if (status === 'loading' || !form) return <Loading label="Loading your profile…" />
  if (status === 'error') {
    return (
      <section className="page">
        <h1>Career Profile</h1>
        <ErrorMessage error={error} fallback="Could not load your profile." />
      </section>
    )
  }

  const patch = (p: Partial<ProfileFields>) => {
    setForm((f) => (f ? { ...f, ...p } : f))
    setSaved(false)
  }

  const onSave = async () => {
    if (emailError) {
      setSaveError(new Error(emailError))
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await profileService.updateProfile(cleanProfilePayload(form))
      setProfile(updated)
      setForm(toFields(updated))
      setSaved(true)
    } catch (e) {
      setSaveError(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page">
      <div className="page__header">
        <h1>Career Profile</h1>
        <div className="page__actions">
          {saved && !dirty ? <span className="badge badge--ok">Saved</span> : null}
          <Button onClick={onSave} loading={saving} disabled={!dirty || Boolean(emailError)}>
            Save changes
          </Button>
        </div>
      </div>

      <ErrorMessage error={saveError} />

      <PersonalInfoForm value={form} onChange={patch} emailError={emailError} />
      <SkillsForm value={form.skills} onChange={(skills) => patch({ skills })} />
      <ExperienceForm value={form.experience} onChange={(experience) => patch({ experience })} />
      <EducationForm value={form.education} onChange={(education) => patch({ education })} />
      <ProjectsForm value={form.projects} onChange={(projects) => patch({ projects })} />
      <CertificationsForm
        value={form.certifications}
        onChange={(certifications) => patch({ certifications })}
      />
      <LanguagesForm value={form.languages} onChange={(languages) => patch({ languages })} />
      <AwardsForm value={form.awards} onChange={(awards) => patch({ awards })} />

      <div className="page__footer">
        <Button onClick={onSave} loading={saving} disabled={!dirty || Boolean(emailError)}>
          Save changes
        </Button>
      </div>
    </section>
  )
}
