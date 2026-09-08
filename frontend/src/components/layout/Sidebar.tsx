import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

// Routes fill in as later tasks add their pages.
const ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/profile', label: 'Career Profile' },
  { to: '/cvs', label: 'My CVs' },
  { to: '/chat', label: 'AI Chatbot' },
]

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Primary">
      <ul>
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
