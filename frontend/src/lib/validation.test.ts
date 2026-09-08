import { describe, expect, it } from 'vitest'

import {
  hasErrors,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateRequired,
} from './validation'

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('')).toMatch(/required/i)
  })
  it('rejects malformed addresses', () => {
    expect(validateEmail('nope')).toMatch(/valid email/i)
    expect(validateEmail('a@b')).toMatch(/valid email/i)
  })
  it('accepts a normal address', () => {
    expect(validateEmail('user@example.com')).toBeUndefined()
  })
})

describe('validateNewPassword', () => {
  it('enforces the minimum length', () => {
    expect(validateNewPassword('short')).toMatch(/at least 8/i)
  })
  it('accepts a long enough password', () => {
    expect(validateNewPassword('longenough1')).toBeUndefined()
  })
})

describe('validatePasswordConfirmation', () => {
  it('requires confirmation', () => {
    expect(validatePasswordConfirmation('abc', '')).toMatch(/confirm/i)
  })
  it('flags a mismatch', () => {
    expect(validatePasswordConfirmation('abc12345', 'abc12346')).toMatch(/do not match/i)
  })
  it('passes when equal', () => {
    expect(validatePasswordConfirmation('abc12345', 'abc12345')).toBeUndefined()
  })
})

describe('helpers', () => {
  it('validateRequired', () => {
    expect(validateRequired('  ', 'Name')).toBe('Name is required.')
    expect(validateRequired('x')).toBeUndefined()
  })
  it('hasErrors', () => {
    expect(hasErrors({ a: undefined, b: undefined })).toBe(false)
    expect(hasErrors({ a: undefined, b: 'bad' })).toBe(true)
  })
})
