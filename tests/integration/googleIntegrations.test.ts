import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { GoogleAuth } from '../../src/main/services/googleAuth'
import { GoogleAccountStore } from '../../src/main/services/googleAccountStore'
import { googleEndpointsFor } from '../../src/main/utils/googleEndpointsFor'
import { listSearchConsoleSites } from '../../src/main/integrations/searchConsoleClient'
import { listAnalyticsProperties } from '../../src/main/integrations/analyticsClient'
import { runFixtureCrawl, type FixtureCrawl } from '../fixtures/runFixtureCrawl'
import { FAKE_CLIENT, FAKE_EMAIL, FAKE_GA_PROPERTY, startFakeGoogle, type FakeGoogle } from '../fixtures/fakeGoogleServer'
import { plainSecretCodec } from '../fixtures/plainSecretCodec'

let google: FakeGoogle
let dir: string
let store: GoogleAccountStore
let crawl: FixtureCrawl

const openInFetch = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Login page returned ${res.status}`)
}

const newAuth = (s = store) => new GoogleAuth(s, googleEndpointsFor(google.base), openInFetch, 10000)

const googleConfig = (startUrl: string): CrawlConfig => ({
  ...DEFAULT_CONFIG,
  startUrl,
  integrations: {
    ...DEFAULT_CONFIG.integrations,
    searchConsole: { ...DEFAULT_CONFIG.integrations.searchConsole, enabled: true, siteUrl: startUrl, crawlNewUrls: true, urlInspection: true, maxInspections: 200 },
    analytics: { ...DEFAULT_CONFIG.integrations.analytics, enabled: true, propertyId: FAKE_GA_PROPERTY }
  }
})

beforeAll(async () => {
  google = await startFakeGoogle()
  dir = mkdtempSync(join(tmpdir(), 'seo-spider-google-'))
  store = new GoogleAccountStore(join(dir, 'google-account.bin'), plainSecretCodec)
})

afterAll(async () => {
  await crawl?.close()
  await google?.close()
  rmSync(dir, { recursive: true, force: true })
})

describe('Google sign-in', () => {
  it('signs in through a loopback redirect with PKCE and stores the account', async () => {
    const status = await newAuth().connect(FAKE_CLIENT.id, FAKE_CLIENT.secret)
    expect(status).toEqual({ connected: true, email: FAKE_EMAIL, clientId: FAKE_CLIENT.id })

    const auth = google.requests.find((r) => r.path === '/o/oauth2/v2/auth')
    expect(auth?.query.get('code_challenge_method')).toBe('S256')
    expect(auth?.query.get('access_type')).toBe('offline')
    expect(auth?.query.get('redirect_uri')).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(auth?.query.get('scope')).toContain('webmasters.readonly')
    expect(auth?.query.get('scope')).toContain('analytics.readonly')

    expect(store.read()?.refreshToken).toBe('refresh-1')
    expect(readFileSync(join(dir, 'google-account.bin')).toString('utf8')).not.toContain('refresh-1')
  })

  it('refreshes the access token from the stored account', async () => {
    expect(await newAuth().accessToken()).toBe('access-2')
    const refresh = google.requests.filter((r) => r.path === '/token').map((r) => new URLSearchParams(r.body).get('grant_type'))
    expect(refresh).toContain('refresh_token')
  })

  it('lists Search Console properties and GA4 properties', async () => {
    google.setSite('https://example.com/')
    expect(await listSearchConsoleSites(newAuth())).toEqual([{ id: 'https://example.com/', name: 'https://example.com/' }])
    expect(await listAnalyticsProperties(newAuth())).toEqual([{ id: FAKE_GA_PROPERTY, name: 'Test Account / Fixture GA4' }])
  })

  it('rejects a revoked sign-in with a clear message', async () => {
    const other = new GoogleAccountStore(join(dir, 'revoked.bin'), plainSecretCodec)
    other.write({ clientId: FAKE_CLIENT.id, clientSecret: FAKE_CLIENT.secret, refreshToken: 'revoked', email: null })
    await expect(newAuth(other).accessToken()).rejects.toThrow('Connect again in Configuration > API Access')
  })
})

describe('Search Console and GA4 crawl data', () => {
  beforeAll(async () => {
    crawl = await runFixtureCrawl((startUrl) => {
      google.setSite(startUrl)
      return googleConfig(startUrl)
    }, null, newAuth())
  }, 60000)

  it('stores search analytics and merges URL fragments', () => {
    const root = crawl.db.prepare('SELECT gsc_clicks, gsc_impressions, gsc_position FROM urls WHERE url = ?').get(crawl.site.url) as Record<string, number>
    expect(root.gsc_clicks).toBe(12)
    expect(root.gsc_impressions).toBe(110)
    expect(root.gsc_position).toBeCloseTo(260 / 110, 5)
    expect(crawl.paths('search-console:clicks-above-0')).toEqual(['/', '/gsc-orphan', '/noindex'])
    expect(crawl.paths('search-console:non-indexable-with-data')).toEqual(['/noindex'])
    expect(crawl.paths('search-console:no-data')).toContain('/missing-title')
  })

  it('crawls a new URL found only in Search Console and flags it as an orphan', () => {
    expect(crawl.paths('search-console:orphan-urls')).toEqual(['/gsc-orphan'])
    const row = crawl.db.prepare('SELECT state, status_code, found_via FROM urls WHERE url = ?').get(`${crawl.site.url}gsc-orphan`) as Record<string, unknown>
    expect(row).toEqual({ state: 3, status_code: 200, found_via: 'Search Console' })
  })

  it('stores URL Inspection results', () => {
    expect(crawl.paths('search-console:not-on-google')).toEqual(['/dup-a'])
    expect(crawl.paths('search-console:indexable-not-indexed')).toEqual(['/dup-a'])
    expect(crawl.paths('search-console:canonical-not-selected')).toEqual(['/dup-b'])
    expect(crawl.paths('search-console:rich-result-invalid')).toEqual(['/dup-b'])
    expect(crawl.paths('search-console:on-google-with-issues')).toEqual(['/dup-b'])
    expect(crawl.paths('search-console:inspection-error')).toEqual(['/long-title'])
  })

  it('stores GA4 metrics and keeps a GA-only URL uncrawled', () => {
    expect(crawl.paths('analytics:sessions-above-0')).toEqual(['/', '/ga-orphan', '/no-h1', '/noindex'])
    expect(crawl.paths('analytics:bounce-rate-above-70')).toEqual(['/no-h1'])
    expect(crawl.paths('analytics:non-indexable-with-data')).toEqual(['/noindex'])
    expect(crawl.paths('analytics:orphan-urls')).toEqual(['/ga-orphan'])
    expect(crawl.paths('analytics:no-data')).toContain('/missing-title')
    const orphan = crawl.db.prepare('SELECT state FROM urls WHERE url = ?').get(`${crawl.site.url}ga-orphan`) as { state: number }
    expect(orphan.state).toBe(0)
  })

  it('sends the right API requests with the bearer token', () => {
    const query = google.requests.find((r) => r.path.endsWith('/searchAnalytics/query'))
    const body = JSON.parse(query!.body)
    expect(body).toMatchObject({ dimensions: ['page'], type: 'web', rowLimit: 25000, startRow: 0 })
    expect(body.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const report = JSON.parse(google.requests.find((r) => r.path.endsWith(':runReport'))!.body)
    expect(report.dimensions).toEqual([{ name: 'hostName' }, { name: 'pagePath' }])
    expect(report.metrics.map((m: { name: string }) => m.name)).toContain('sessions')
    const api = google.requests.filter((r) => r.path.startsWith('/webmasters') || r.path.startsWith('/v1'))
    expect(api.every((r) => String(r.headers.authorization).startsWith('Bearer access-'))).toBe(true)
    expect(crawl.result.message).toBeNull()
  })
})

describe('Google warnings', () => {
  it('finishes the crawl with a warning when no account is connected', async () => {
    const empty = new GoogleAccountStore(join(dir, 'empty.bin'), plainSecretCodec)
    const run = await runFixtureCrawl((startUrl) => googleConfig(startUrl), null, newAuth(empty))
    try {
      expect(run.result.message).toContain('Search Console: Google account is not connected')
      expect(run.result.message).toContain('GA4: Google account is not connected')
      expect(run.paths('search-console:all')).toEqual([])
    } finally {
      await run.close()
    }
  }, 60000)

  it('skips Google data with a warning when the crawl runs outside the desktop app', async () => {
    const run = await runFixtureCrawl((startUrl) => googleConfig(startUrl))
    try {
      expect(run.result.message).toContain('run only in the desktop app')
    } finally {
      await run.close()
    }
  }, 60000)
})
