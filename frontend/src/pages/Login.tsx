import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Button, ErrorMessage, Input } from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import { hasErrors, validateEmail, validateRequired } from '@/lib/validation'

interface FieldErrors {
  email?: string
  password?: string
}

export default function Login() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  function fieldErrors(): FieldErrors {
    return {
      email: validateEmail(email),
      password: validateRequired(password, 'Password'),
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = fieldErrors()
    setErrors(next)
    if (hasErrors(next)) return

    setSubmitting(true)
    setServerError(null)
    try {
      await login({ email: email.trim(), password })
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <h1>Sign in</h1>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, email: validateEmail(email) }))}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() =>
            setErrors((p) => ({ ...p, password: validateRequired(password, 'Password') }))
          }
          error={errors.password}
        />

        <ErrorMessage error={serverError} />

        <Button type="submit" loading={submitting}>
          Sign in
        </Button>
        <p className="auth-card__alt">
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  )
}
