import { Link } from 'react-router-dom'

import { Button } from '@/components/common'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        AI Career Assistant
      </Link>
      <div className="navbar__spacer" />
      {user ? (
        <>
          <span className="navbar__user">{user.email}</span>
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </>
      ) : null}
    </header>
  )
}
