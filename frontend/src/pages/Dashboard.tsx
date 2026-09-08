import { useAuth } from '@/hooks/useAuth'

// Placeholder — Task 22 builds the real dashboard.
export default function Dashboard() {
  const { user } = useAuth()
  return (
    <section className="page">
      <h1>Dashboard</h1>
      <p>
        Signed in as <strong>{user?.email}</strong>.
      </p>
      <p className="muted">
        Career profile, CV tools, analysis, and the chatbot land here in later tasks.
      </p>
    </section>
  )
}
