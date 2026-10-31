import type { GoogleEndpoints } from './googleEndpoints'

export interface GoogleApiContext {
  endpoints: GoogleEndpoints
  accessToken(): Promise<string>
}
