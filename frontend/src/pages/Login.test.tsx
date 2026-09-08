import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/context/AuthProvider'
import { authService } from '@/services/authService'
import Login from './Login'

vi.mock('@/services/authService', () => ({
  authService: { login: vi.fn(), register: vi.fn(), me: vi.fn() },
}))

const mockedLogin = vi.mocked(authService.login)
const mockedMe = vi.mocked(authService.me)

beforeEach(() => {
  mockedLogin.mockReset()
  mockedMe.mockReset()
  localStorage.clear()
})
afterEach(() => localStorage.clear())

function setup(entry: string | { pathname: string; state?: unknown } = '/login') {
  return render(
    <MemoryRouter initialEntries={[entry as string]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>DASHBOARD</div>} />
          <Route path="/secret" element={<div>SECRET</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const TOKENS = { access_token: 'a', refresh_token: 'r', token_type: 'bearer' }
const USER = { id: 1, email: 'user@example.com', is_active: true, created_at: '2026-01-01' }

describe('<Login />', () => {
  it('renders the sign-in form', () => {
    setup()
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows a validation error for a bad email and does not submit', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'whatever')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument()
    expect(mockedLogin).not.toHaveBeenCalled()
  })

  it('requires a password', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('logs in and redirects on success', async () => {
    mockedLogin.mockResolvedValue(TOKENS)
    mockedMe.mockResolvedValue(USER)
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText('Email'), '  user@example.com  ')
    await user.type(screen.getByLabelText('Password'), 'hunter2pw')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument()
    expect(mockedLogin).toHaveBeenCalledWith({ email: 'user@example.com', password: 'hunter2pw' })
  })

  it('redirects to the originally requested page', async () => {
    mockedLogin.mockResolvedValue(TOKENS)
    mockedMe.mockResolvedValue(USER)
    const user = userEvent.setup()
    setup({ pathname: '/login', state: { from: '/secret' } })

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'hunter2pw')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('SECRET')).toBeInTheDocument()
  })

  it('surfaces a server error', async () => {
    const err = new AxiosError('Request failed')
    err.response = {
      status: 401,
      data: { detail: 'Incorrect email or password' },
    } as AxiosError['response']
    mockedLogin.mockRejectedValue(err)
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument()
  })
})
