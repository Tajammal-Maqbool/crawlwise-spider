import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import type { FilterCounts } from '@shared/interfaces/filterCount'
import { openCrawlDb } from '../../src/main/db/openCrawlDb'
import { CrawlEngine } from '../../src/main/crawler/engine'
import { countFilters, queryAllRows } from '../../src/main/db/queryService'
import { startFixtureSite, type FixtureSite } from '../fixtures/fixtureSite'

let site: FixtureSite
let db: DatabaseSync
let dir: string
let counts: FilterCounts

const addresses = (filterKey: string): string[] =>
  queryAllRows(db, filterKey, DEFAULT_CONFIG.thresholds).rows.map((r) => new URL(String(r.address)).pathname)

beforeAll(async () => {
  site = await startFixtureSite()
  dir = mkdtempSync(join(tmpdir(), 'seo-spider-test-'))
  db = openCrawlDb(join(dir, 'crawl.sqlite'))
  const config = { ...DEFAULT_CONFIG, startUrl: site.url }
  const engine = new CrawlEngine(db, config, 'test', () => undefined, () => 0)
  const result = await engine.run(false)
  expect(result.state).toBe('completed')
  counts = countFilters(db, DEFAULT_CONFIG.thresholds)
})

afterAll(async () => {
  db?.close()
  await site?.close()
  rmSync(dir, { recursive: true, force: true })
})

describe('crawl of the fixture site', () => {
  it('fetches robots.txt before any page', () => {
    expect(site.requests[0]).toMatch(/robots\.txt$/)
  })

  it('does not fetch disallowed or nofollow URLs', () => {
    expect(site.requests.some((r) => r.includes('/private/secret'))).toBe(false)
    expect(site.requests.some((r) => r.includes('/nofollow-target'))).toBe(false)
  })

  it('reports response codes', () => {
    expect(addresses('response-codes:internal-blocked-by-robots')).toEqual(['/private/secret'])
    expect(addresses('response-codes:internal-client-error').sort()).toEqual(['/does-not-exist', '/gone-from-sitemap'])
    expect(addresses('response-codes:internal-server-error')).toEqual(['/server-error'])
    expect(addresses('response-codes:internal-redirect-chain')).toEqual(['/redirect-1'])
    expect(addresses('response-codes:internal-redirect-loop').sort()).toEqual(['/loop-a', '/loop-b'])
    expect(addresses('response-codes:internal-redirection-meta-refresh')).toEqual(['/meta-refresh'])
  })

  it('reports page title issues', () => {
    expect(addresses('page-titles:missing')).toContain('/missing-title')
    expect(addresses('page-titles:duplicate').sort()).toEqual(['/dup-a', '/dup-b', '/exact-a', '/exact-b'])
    expect(addresses('page-titles:over-characters')).toEqual(['/long-title'])
  })

  it('reports meta description and heading issues', () => {
    expect(addresses('meta-description:missing')).toContain('/no-desc')
    expect(addresses('h1:multiple')).toEqual(['/multi-h1'])
    expect(addresses('h1:missing')).toContain('/no-h1')
  })

  it('reports canonicals and directives', () => {
    expect(addresses('canonicals:canonicalised')).toEqual(['/canonicalised'])
    expect(addresses('canonicals:self-referencing')).toEqual(['/'])
    expect(addresses('directives:noindex')).toEqual(['/noindex'])
  })

  it('reports image issues', () => {
    expect(addresses('images:missing-alt-attribute')).toEqual(['/img/no-alt.png'])
    expect(addresses('images:missing-alt-text')).toEqual(['/img/empty-alt.png'])
    expect(addresses('images:over-kb')).toEqual(['/img/large.png'])
  })

  it('reports URL, content and link issues', () => {
    expect(addresses('url:uppercase')).toEqual(['/Upper_Case'])
    expect(addresses('url:underscores')).toEqual(['/Upper_Case'])
    expect(addresses('content:lorem-ipsum')).toEqual(['/lorem'])
    expect(addresses('content:exact-duplicates').sort()).toEqual(['/exact-a', '/exact-b'])
    expect(addresses('links:internal-outlinks-no-anchor')).toEqual(['/'])
    expect(addresses('links:non-descriptive-anchor')).toEqual(['/'])
  })

  it('separates internal and external URLs', () => {
    expect(addresses('external:all')).toEqual(['/external-page'])
    expect(counts['internal:images']).toBe(3)
  })

  it('counts inlinks after analysis', () => {
    const home = db.prepare("SELECT unique_inlinks, unique_outlinks FROM urls WHERE url = ?").get(site.url) as { unique_inlinks: number; unique_outlinks: number }
    expect(home.unique_outlinks).toBeGreaterThan(20)
    const dupA = db.prepare("SELECT inlinks FROM urls WHERE url = ?").get(`${site.url}dup-a`) as { inlinks: number }
    expect(dupA.inlinks).toBe(2)
  })
})
