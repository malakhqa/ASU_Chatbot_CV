export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Credentials {
  email: string
  password: string
}

export type RegisterPayload = Credentials
