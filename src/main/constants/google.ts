import type { GoogleEndpoints } from '../interfaces/googleEndpoints'

export const GOOGLE_ENDPOINTS: GoogleEndpoints = {
  auth: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  revoke: 'https://oauth2.googleapis.com/revoke',
  searchConsole: 'https://searchconsole.googleapis.com/webmasters/v3',
  urlInspection: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
  analyticsData: 'https://analyticsdata.googleapis.com/v1beta',
  analyticsAdmin: 'https://analyticsadmin.googleapis.com/v1beta'
}

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly'
]

export const GA4_METRICS = ['sessions', 'totalUsers', 'screenPageViews', 'engagementRate', 'averageSessionDuration', 'bounceRate', 'keyEvents']

export const GOOGLE_LOGIN_TIMEOUT_MS = 5 * 60 * 1000

export const GOOGLE_API_BASE_ENV = 'SEO_SPIDER_GOOGLE_API_BASE'
