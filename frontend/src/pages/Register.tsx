import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { Button, ErrorMessage, Input } from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import {
  hasErrors,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from '@/lib/validation'

interface FieldErrors {
  email?: string
  password?: string
  confirm?: string
}

export default function Register() {
  const { status, register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  function fieldErrors(): FieldErrors {
    return {
      email: validateEmail(email),
      password: validateNewPassword(password),
      confirm: validatePasswordConfirmation(password, confirm),
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
      await register({ email: email.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <h1>Create your account</h1>

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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, password: validateNewPassword(password) }))}
          error={errors.password}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() =>
            setErrors((p) => ({
              ...p,
              confirm: validatePasswordConfirmation(password, confirm),
            }))
          }
          error={errors.confirm}
        />

        <ErrorMessage error={serverError} />

        <Button type="submit" loading={submitting}>
          Create account
        </Button>
        <p className="auth-card__alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
