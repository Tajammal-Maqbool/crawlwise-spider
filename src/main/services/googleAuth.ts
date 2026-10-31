import type { GoogleAccountStatus } from '@shared/interfaces/googleAccount'
import { GOOGLE_LOGIN_TIMEOUT_MS, GOOGLE_SCOPES } from '../constants/google'
import type { GoogleApiContext } from '../interfaces/googleApi'
import type { GoogleEndpoints } from '../interfaces/googleEndpoints'
import type { LoopbackLogin } from '../interfaces/loopbackLogin'
import { GoogleApiError } from '../integrations/googleApiError'
import { jwtPayload } from '../utils/jwtPayload'
import { pkceChallenge, randomUrlToken } from '../utils/pkce'
import type { GoogleAccountStore } from './googleAccountStore'
import { exchangeAuthCode, refreshGoogleToken, revokeGoogleToken } from './googleOAuthClient'
import { startLoopbackLogin } from './oauthLoopback'

const EXPIRY_MARGIN_MS = 60000

export class GoogleAuth implements GoogleApiContext {
  private cached: { token: string; expiresAt: number } | null = null
  private refreshing: Promise<string> | null = null
  private login: LoopbackLogin | null = null

  constructor(
    private readonly store: GoogleAccountStore,
    readonly endpoints: GoogleEndpoints,
    private readonly openBrowser: (url: string) => Promise<void>,
    private readonly loginTimeoutMs = GOOGLE_LOGIN_TIMEOUT_MS
  ) {}

  status(): GoogleAccountStatus {
    const account = this.store.read()
    return { connected: account !== null, email: account?.email ?? null, clientId: account?.clientId ?? null }
  }

  async connect(clientId: string, clientSecret: string): Promise<GoogleAccountStatus> {
    if (!clientId.trim() || !clientSecret.trim()) throw new Error('Enter the OAuth client ID and client secret first.')
    this.login?.close()
    const verifier = randomUrlToken()
    const state = randomUrlToken(16)
    const login = await startLoopbackLogin(state, this.loginTimeoutMs)
    this.login = login
    try {
      const query = new URLSearchParams({
        client_id: clientId.trim(),
        redirect_uri: login.redirectUri,
        response_type: 'code',
        scope: GOOGLE_SCOPES.join(' '),
        code_challenge: pkceChallenge(verifier),
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent',
        state
      })
      await this.openBrowser(`${this.endpoints.auth}?${query}`)
      const code = await login.code
      const tokens = await exchangeAuthCode(this.endpoints, { code, clientId: clientId.trim(), clientSecret: clientSecret.trim(), redirectUri: login.redirectUri, verifier })
      if (!tokens.refresh_token) throw new Error('Google did not return a refresh token. Remove this app from your Google account access list, then connect again.')
      const email = jwtPayload(tokens.id_token)?.email
      this.store.write({ clientId: clientId.trim(), clientSecret: clientSecret.trim(), refreshToken: tokens.refresh_token, email: typeof email === 'string' ? email : null })
      this.cached = { token: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 }
      return this.status()
    } finally {
      login.close()
      if (this.login === login) this.login = null
    }
  }

  async disconnect(): Promise<GoogleAccountStatus> {
    const account = this.store.read()
    this.store.clear()
    this.cached = null
    if (account) await revokeGoogleToken(this.endpoints, account.refreshToken).catch(() => undefined)
    return this.status()
  }

  accessToken(): Promise<string> {
    if (this.cached && this.cached.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return Promise.resolve(this.cached.token)
    this.refreshing ??= this.refresh().finally(() => (this.refreshing = null))
    return this.refreshing
  }

  private async refresh(): Promise<string> {
    const account = this.store.read()
    if (!account) throw new Error('Google account is not connected. Connect it in Configuration > API Access.')
    try {
      const tokens = await refreshGoogleToken(this.endpoints, account)
      this.cached = { token: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 }
      return tokens.access_token
    } catch (err) {
      if (err instanceof GoogleApiError && err.code === 'invalid_grant') {
        throw new Error('Google sign-in expired or was removed. Connect again in Configuration > API Access.')
      }
      throw err
    }
  }
}
