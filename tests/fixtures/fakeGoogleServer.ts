import { createHash } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

export const FAKE_CLIENT = { id: 'client-1', secret: 'secret-1' }
export const FAKE_EMAIL = 'tester@example.com'
export const FAKE_GA_PROPERTY = '123'

export interface FakeGoogleRequest {
  method: string
  path: string
  query: URLSearchParams
  headers: IncomingMessage['headers']
  body: string
}

export interface FakeGoogle {
  base: string
  requests: FakeGoogleRequest[]
  setSite: (siteUrl: string) => void
  close: () => Promise<void>
}

const VALID_TOKENS = new Set(['Bearer access-1', 'Bearer access-2'])

export async function startFakeGoogle(): Promise<FakeGoogle> {
  const requests: FakeGoogleRequest[] = []
  let site = 'http://127.0.0.1/'
  let login: { challenge: string; redirectUri: string } | null = null

  const json = (res: ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body))
  }

  const tokenGrant = (res: ServerResponse, form: URLSearchParams) => {
    const badClient = form.get('client_id') !== FAKE_CLIENT.id || form.get('client_secret') !== FAKE_CLIENT.secret
    if (form.get('grant_type') === 'authorization_code') {
      const verifier = form.get('code_verifier') ?? ''
      const pkceOk = login !== null && createHash('sha256').update(verifier).digest('base64url') === login.challenge
      if (badClient || form.get('code') !== 'test-code' || !pkceOk || form.get('redirect_uri') !== login?.redirectUri) {
        return json(res, 400, { error: 'invalid_grant', error_description: 'Bad authorization code exchange' })
      }
      const idToken = ['e30', Buffer.from(JSON.stringify({ email: FAKE_EMAIL })).toString('base64url'), 'sig'].join('.')
      return json(res, 200, { access_token: 'access-1', expires_in: 3600, refresh_token: 'refresh-1', id_token: idToken, token_type: 'Bearer' })
    }
    if (form.get('grant_type') === 'refresh_token' && !badClient && form.get('refresh_token') === 'refresh-1') {
      return json(res, 200, { access_token: 'access-2', expires_in: 3600, token_type: 'Bearer' })
    }
    return json(res, 400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' })
  }

  const inspect = (res: ServerResponse, body: { inspectionUrl: string; siteUrl: string }) => {
    const path = new URL(body.inspectionUrl).pathname
    if (body.siteUrl !== site) return json(res, 403, { error: { code: 403, message: 'Wrong property', status: 'PERMISSION_DENIED' } })
    if (path === '/long-title') return json(res, 403, { error: { code: 403, message: 'URL is not part of this property', status: 'PERMISSION_DENIED' } })
    const index = { verdict: 'PASS', coverageState: 'Submitted and indexed', indexingState: 'INDEXING_ALLOWED', robotsTxtState: 'ALLOWED', pageFetchState: 'SUCCESSFUL', lastCrawlTime: '2026-10-01T10:00:00Z', crawledAs: 'MOBILE', googleCanonical: body.inspectionUrl, userCanonical: body.inspectionUrl }
    if (path === '/dup-a') Object.assign(index, { verdict: 'NEUTRAL', coverageState: 'Crawled - currently not indexed' })
    if (path === '/dup-b') Object.assign(index, { googleCanonical: `${site}dup-a` })
    const richResultsResult = path === '/dup-b' ? { verdict: 'FAIL' } : undefined
    return json(res, 200, { inspectionResult: { indexStatusResult: index, richResultsResult } })
  }

  const metric = (values: number[]) => values.map((v) => ({ value: String(v) }))
  const gaRow = (host: string, path: string, values: number[]) => ({ dimensionValues: [{ value: host }, { value: path }], metricValues: metric(values) })

  const route = (req: IncomingMessage, res: ServerResponse, url: URL, body: string) => {
    const path = url.pathname
    if (path === '/o/oauth2/v2/auth') {
      const redirectUri = url.searchParams.get('redirect_uri') ?? ''
      login = { challenge: url.searchParams.get('code_challenge') ?? '', redirectUri }
      res.writeHead(302, { location: `${redirectUri}?code=test-code&state=${encodeURIComponent(url.searchParams.get('state') ?? '')}` })
      return res.end()
    }
    if (path === '/token') return tokenGrant(res, new URLSearchParams(body))
    if (path === '/revoke') return json(res, 200, {})
    if (!VALID_TOKENS.has(String(req.headers.authorization))) {
      return json(res, 401, { error: { code: 401, message: 'Invalid Credentials', status: 'UNAUTHENTICATED' } })
    }
    if (path === '/webmasters/v3/sites') {
      return json(res, 200, { siteEntry: [{ siteUrl: site, permissionLevel: 'siteOwner' }, { siteUrl: 'https://other.example/', permissionLevel: 'siteUnverifiedUser' }] })
    }
    if (path === `/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`) {
      return json(res, 200, {
        rows: [
          { keys: [site], clicks: 10, impressions: 100, ctr: 0.1, position: 2.5 },
          { keys: [`${site}#top`], clicks: 2, impressions: 10, ctr: 0.2, position: 1 },
          { keys: [`${site}noindex`], clicks: 1, impressions: 20, ctr: 0.05, position: 8 },
          { keys: [`${site}gsc-orphan`], clicks: 3, impressions: 30, ctr: 0.1, position: 5 },
          { keys: ['https://elsewhere.example/page'], clicks: 9, impressions: 90, ctr: 0.1, position: 3 }
        ]
      })
    }
    if (path === '/v1/urlInspection/index:inspect') return inspect(res, JSON.parse(body))
    if (path === '/v1beta/accountSummaries') {
      return json(res, 200, { accountSummaries: [{ displayName: 'Test Account', propertySummaries: [{ property: `properties/${FAKE_GA_PROPERTY}`, displayName: 'Fixture GA4' }] }] })
    }
    if (path === `/v1beta/properties/${FAKE_GA_PROPERTY}:runReport`) {
      const host = new URL(site).hostname
      const rows = [
        gaRow(host, '/', [50, 40, 70, 0.6, 30, 0.4, 2]),
        gaRow(host, '/no-h1', [5, 5, 6, 0.1, 4, 0.9, 0]),
        gaRow(host, '/noindex', [2, 2, 2, 0.5, 10, 0.5, 0]),
        gaRow(host, '/ga-orphan', [4, 3, 4, 0.5, 12, 0.5, 1]),
        gaRow('(not set)', '(not set)', [1, 1, 1, 0, 0, 1, 0]),
        gaRow('elsewhere.example', '/', [9, 9, 9, 0.5, 5, 0.5, 0])
      ]
      return json(res, 200, { rows, rowCount: rows.length })
    }
    json(res, 404, { error: { code: 404, message: `No fake route for ${path}`, status: 'NOT_FOUND' } })
  }

  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += String(c)))
    req.on('end', () => {
      const url = new URL(req.url ?? '/', 'http://fake.google')
      requests.push({ method: req.method ?? 'GET', path: url.pathname, query: url.searchParams, headers: req.headers, body })
      route(req, res, url, body)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  return {
    base: `http://127.0.0.1:${port}`,
    requests,
    setSite: (siteUrl) => (site = siteUrl),
    close: () => new Promise((resolve) => server.close(() => resolve()))
  }
}
