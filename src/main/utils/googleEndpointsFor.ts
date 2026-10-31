import { GOOGLE_ENDPOINTS } from '../constants/google'
import type { GoogleEndpoints } from '../interfaces/googleEndpoints'

export function googleEndpointsFor(base: string | undefined): GoogleEndpoints {
  if (!base) return GOOGLE_ENDPOINTS
  const root = base.replace(/\/$/, '')
  return {
    auth: `${root}/o/oauth2/v2/auth`,
    token: `${root}/token`,
    revoke: `${root}/revoke`,
    searchConsole: `${root}/webmasters/v3`,
    urlInspection: `${root}/v1/urlInspection/index:inspect`,
    analyticsData: `${root}/v1beta`,
    analyticsAdmin: `${root}/v1beta`
  }
}
