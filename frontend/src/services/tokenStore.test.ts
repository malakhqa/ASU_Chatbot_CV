import { afterEach, describe, expect, it } from 'vitest'

import { clearTokens, getTokens, setTokens } from './tokenStore'

afterEach(() => {
  clearTokens()
})

describe('tokenStore', () => {
  it('returns nulls when nothing is stored', () => {
    expect(getTokens()).toEqual({ access: null, refresh: null })
  })

  it('round-trips tokens through storage', () => {
    setTokens({ access: 'a-token', refresh: 'r-token' })
    expect(getTokens()).toEqual({ access: 'a-token', refresh: 'r-token' })
  })

  it('clears tokens', () => {
    setTokens({ access: 'a', refresh: 'r' })
    clearTokens()
    expect(getTokens()).toEqual({ access: null, refresh: null })
  })
})
