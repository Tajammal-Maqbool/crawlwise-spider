import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import { runFixtureCrawl, type FixtureCrawl } from '../fixtures/runFixtureCrawl'
import { getApiStatus, getDepthStats, getResponseTimes } from '../../src/main/db/statsService'
import { getTreeRows } from '../../src/main/db/treeService'
import { getUrlDetail } from '../../src/main/db/detailService'

let crawl: FixtureCrawl
const t = DEFAULT_CONFIG.thresholds

beforeAll(async () => {
  crawl = await runFixtureCrawl((startUrl) => ({ ...DEFAULT_CONFIG, startUrl }))
})

afterAll(async () => {
  await crawl?.close()
})

const internalCount = () => crawl.paths('internal:all').length

describe('crawl stats', () => {
  it('splits internal URLs by crawl depth', () => {
    const stats = getDepthStats(crawl.db)
    expect(stats.reduce((s, r) => s + r.urls, 0)).toBe(internalCount())
    expect(stats[0]).toMatchObject({ depth: 0, urls: 1 })
  })

  it('puts every timed internal URL in one response time bucket', () => {
    const stats = getResponseTimes(crawl.db)
    expect(stats.buckets).toHaveLength(11)
    expect(stats.buckets[0].label).toBe('0 - 1')
    expect(stats.buckets[10].label).toBe('Over 10')
    const timed = (crawl.db.prepare('SELECT count(*) AS n FROM urls WHERE is_internal = 1 AND state = 3 AND response_time_ms IS NOT NULL').get() as { n: number }).n
    expect(stats.buckets.reduce((s, b) => s + b.urls, 0)).toBe(timed)
  })

  it('lists no API rows when no integration ran', () => {
    expect(getApiStatus(crawl.db)).toEqual([])
  })
})

describe('tree view rows', () => {
  it('starts with the site origin, then lists folders before pages', () => {
    const root = getTreeRows(crawl.db, 'internal:all', t, '')
    expect(root).toEqual([expect.objectContaining({ path: crawl.site.url, isFolder: true, urls: internalCount() })])
    const level = getTreeRows(crawl.db, 'internal:all', t, crawl.site.url)
    const firstLeaf = level.findIndex((r) => !r.isFolder)
    expect(level.slice(0, firstLeaf).every((r) => r.isFolder)).toBe(true)
    expect(level.some((r) => r.isFolder && r.label === 'img/')).toBe(true)
    expect(level.some((r) => !r.isFolder && r.label === 'dup-a')).toBe(true)
  })

  it('caps each level at the limit', () => {
    expect(getTreeRows(crawl.db, 'internal:all', t, crawl.site.url, 2)).toHaveLength(2)
  })
})

describe('detail data', () => {
  it('lists near duplicate pairs for a page', () => {
    const id = (crawl.db.prepare('SELECT id FROM urls WHERE url = ?').get(`${crawl.site.url}near-1`) as { id: number }).id
    const detail = getUrlDetail(crawl.db, id)
    expect(detail.duplicates.map((d) => d.url)).toContain(`${crawl.site.url}near-2`)
    expect(detail.url).toBe(`${crawl.site.url}near-1`)
  })

  it('lists image resources of a page', () => {
    const id = (crawl.db.prepare('SELECT id FROM urls WHERE url = ?').get(`${crawl.site.url}images`) as { id: number }).id
    expect(getUrlDetail(crawl.db, id).resources.filter((r) => r.type === 'Image')).toHaveLength(3)
  })
})
