export const MIN_PASSWORD_LENGTH = 8

// Deliberately permissive — the backend is the source of truth.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRequired(value: string, label = 'This field'): string | undefined {
  return value.trim() ? undefined : `${label} is required.`
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email is required.'
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address.'
  return undefined
}

/** Like validateEmail but an empty value is allowed. */
export function validateEmailOptional(value: string | null | undefined): string | undefined {
  if (!value || !value.trim()) return undefined
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address.'
  return undefined
}

/** Full strength check — used on registration. */
export function validateNewPassword(value: string): string | undefined {
  if (!value) return 'Password is required.'
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return undefined
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return 'Please confirm your password.'
  if (password !== confirmation) return 'Passwords do not match.'
  return undefined
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean)
}
