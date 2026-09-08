import { Link } from 'react-router-dom'

import { Loading } from '@/components/common'
import { ProfileStatusCard, RecentCVsCard } from '@/components/dashboard'
import { useAuth } from '@/hooks/useAuth'
import { useCVs } from '@/hooks/useCVs'
import { useProfile } from '@/hooks/useProfile'
import { profileCompleteness, toFields } from '@/lib/profile'

export default function Dashboard() {
  const { user } = useAuth()
  const { profile, status: profileStatus } = useProfile()
  const { cvs, status: cvsStatus } = useCVs()

  const displayName = profile?.full_name?.trim() || user?.email || ''
  const loading = profileStatus === 'loading' || cvsStatus === 'loading'

  return (
    <section className="page">
      <h1>Welcome{displayName ? `, ${displayName}` : ''}</h1>
      <p className="muted">One profile, then generate, analyse and tailor CVs for any role.</p>

      {loading ? (
        <Loading label="Loading your dashboard…" />
      ) : (
        <>
          <div className="dash-grid">
            {profile ? (
              <ProfileStatusCard completeness={profileCompleteness(toFields(profile))} />
            ) : null}
            <RecentCVsCard cvs={cvs} />
          </div>

          <div className="dash-actions">
            <Link to="/cvs/new" className="btn btn--primary">
              Create a CV
            </Link>
            <Link to="/profile" className="btn btn--secondary">
              Edit profile
            </Link>
            <Link to="/chat" className="btn btn--secondary">
              Ask the assistant
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
