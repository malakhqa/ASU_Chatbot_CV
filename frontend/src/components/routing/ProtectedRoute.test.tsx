import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)

function setup() {
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/private" element={<div>PRIVATE</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('<ProtectedRoute />', () => {
  it('shows a loader while the session is resolving', () => {
    mockedUseAuth.mockReturnValue({ status: 'loading' } as ReturnType<typeof useAuth>)
    setup()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('PRIVATE')).not.toBeInTheDocument()
  })

  it('redirects anonymous users to /login', () => {
    mockedUseAuth.mockReturnValue({ status: 'anonymous' } as ReturnType<typeof useAuth>)
    setup()
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
  })

  it('renders the child route when authenticated', () => {
    mockedUseAuth.mockReturnValue({ status: 'authenticated' } as ReturnType<typeof useAuth>)
    setup()
    expect(screen.getByText('PRIVATE')).toBeInTheDocument()
  })
})
