import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import type { DatabaseSync } from 'node:sqlite'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import { openCrawlDb } from '../../src/main/db/openCrawlDb'
import { compareFields, compareFilters, diffUrls, fieldChanges } from '../../src/main/db/compareService'
import { FILTERS_BY_KEY } from '@shared/constants/filterRegistry'
import { runFixtureCrawl, type FixtureCrawl } from '../fixtures/runFixtureCrawl'

let crawl: FixtureCrawl
let current: DatabaseSync
let dir: string

beforeAll(async () => {
  crawl = await runFixtureCrawl((startUrl) => ({ ...DEFAULT_CONFIG, startUrl }))
  dir = mkdtempSync(join(tmpdir(), 'seo-spider-compare-'))
  const copy = join(dir, 'current.sqlite')
  crawl.db.exec(`VACUUM INTO '${copy.replace(/'/g, "''")}'`)
  current = openCrawlDb(copy)
  current.exec("UPDATE urls SET title = 'A Brand New Unique Title For Dup A' WHERE url LIKE '%/dup-a'")
  current.exec("DELETE FROM urls WHERE url LIKE '%/lorem'")
})

afterAll(async () => {
  current?.close()
  await crawl?.close()
  rmSync(dir, { recursive: true, force: true })
})

const where = (key: string) => FILTERS_BY_KEY[key].where(DEFAULT_CONFIG.thresholds)
const paths = (urls: string[]) => urls.map((u) => new URL(u).pathname).sort()

describe('crawl comparison', () => {
  it('finds URLs removed from a filter and URLs missing from the crawl', () => {
    const titles = diffUrls(current, crawl.db, where('page-titles:duplicate'))
    expect(paths(titles.removed)).toEqual(['/dup-a', '/dup-b'])
    const lorem = diffUrls(current, crawl.db, where('content:lorem-ipsum'))
    expect(paths(lorem.missing)).toEqual(['/lorem'])
    expect(lorem.new).toEqual([])
  })

  it('summarises every filter', () => {
    const diffs = compareFilters(current, crawl.db, DEFAULT_CONFIG.thresholds)
    const dup = diffs.find((d) => d.filterKey === 'page-titles:duplicate')
    expect(dup).toMatchObject({ previous: 4, current: 2, removed: 2 })
  })

  it('detects changed fields on the same URL', () => {
    const changes = compareFields(current, crawl.db)
    expect(changes.find((c) => c.field === 'Page Titles')?.count).toBe(1)
    const rows = fieldChanges(current, crawl.db, 'Page Titles')
    expect(rows[0].current).toBe('A Brand New Unique Title For Dup A')
    expect(rows[0].previous).toBe('Duplicate Title Shared By Two Pages')
  })
})
