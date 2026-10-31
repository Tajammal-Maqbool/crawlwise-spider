import type { GoogleEndpoints } from '../interfaces/googleEndpoints'
import type { AuthCodeExchange, GoogleTokens, StoredGoogleAccount } from '../interfaces/googleTokens'
import { postGoogleForm } from '../integrations/googleRequest'

export function exchangeAuthCode(endpoints: GoogleEndpoints, input: AuthCodeExchange): Promise<GoogleTokens> {
  return postGoogleForm<GoogleTokens>(endpoints.token, {
    grant_type: 'authorization_code',
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    code_verifier: input.verifier
  })
}

export function refreshGoogleToken(endpoints: GoogleEndpoints, account: StoredGoogleAccount): Promise<GoogleTokens> {
  return postGoogleForm<GoogleTokens>(endpoints.token, {
    grant_type: 'refresh_token',
    refresh_token: account.refreshToken,
    client_id: account.clientId,
    client_secret: account.clientSecret
  })
}

export async function revokeGoogleToken(endpoints: GoogleEndpoints, token: string): Promise<void> {
  await postGoogleForm<unknown>(endpoints.revoke, { token })
}
