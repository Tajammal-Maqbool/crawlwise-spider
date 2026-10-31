export interface GoogleTokens {
  access_token: string
  expires_in: number
  refresh_token?: string
  id_token?: string
}

export interface StoredGoogleAccount {
  clientId: string
  clientSecret: string
  refreshToken: string
  email: string | null
}

export interface AuthCodeExchange {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  verifier: string
}
