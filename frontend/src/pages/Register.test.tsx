import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/context/AuthProvider'
import { authService } from '@/services/authService'
import Register from './Register'

vi.mock('@/services/authService', () => ({
  authService: { login: vi.fn(), register: vi.fn(), me: vi.fn() },
}))

const mockedRegister = vi.mocked(authService.register)
const mockedMe = vi.mocked(authService.me)

beforeEach(() => {
  mockedRegister.mockReset()
  mockedMe.mockReset()
  localStorage.clear()
})
afterEach(() => localStorage.clear())

function setup() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<div>DASHBOARD</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const TOKENS = { access_token: 'a', refresh_token: 'r', token_type: 'bearer' }
const USER = { id: 1, email: 'new@example.com', is_active: true, created_at: '2026-01-01' }

describe('<Register />', () => {
  it('rejects a short password', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.type(screen.getByLabelText('Confirm password'), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(mockedRegister).not.toHaveBeenCalled()
  })

  it('flags mismatched confirmation', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'longenough1')
    await user.type(screen.getByLabelText('Confirm password'), 'longenough2')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument()
    expect(mockedRegister).not.toHaveBeenCalled()
  })

  it('registers and redirects on success', async () => {
    mockedRegister.mockResolvedValue(TOKENS)
    mockedMe.mockResolvedValue(USER)
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'longenough1')
    await user.type(screen.getByLabelText('Confirm password'), 'longenough1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument()
    expect(mockedRegister).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'longenough1',
    })
  })

  it('surfaces a 409 from the server', async () => {
    const err = new AxiosError('Request failed')
    err.response = {
      status: 409,
      data: { detail: 'Email already registered' },
    } as AxiosError['response']
    mockedRegister.mockRejectedValue(err)
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByLabelText('Email'), 'taken@example.com')
    await user.type(screen.getByLabelText('Password'), 'longenough1')
    await user.type(screen.getByLabelText('Confirm password'), 'longenough1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/already registered/i)).toBeInTheDocument()
  })
})
