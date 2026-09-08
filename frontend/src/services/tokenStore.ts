/** Per-browser JWT storage. All access is guarded — storage can throw or be empty. */

const ACCESS_KEY = 'aica.access'
const REFRESH_KEY = 'aica.refresh'

export interface Tokens {
  access: string | null
  refresh: string | null
}

export function getTokens(): Tokens {
  try {
    return {
      access: localStorage.getItem(ACCESS_KEY),
      refresh: localStorage.getItem(REFRESH_KEY),
    }
  } catch {
    return { access: null, refresh: null }
  }
}

export function setTokens(tokens: { access: string; refresh: string }): void {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.access)
    localStorage.setItem(REFRESH_KEY, tokens.refresh)
  } catch {
    /* storage unavailable — session stays in-memory only */
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    /* ignore */
  }
}
