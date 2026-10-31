import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BULK_EXPORTS, ISSUES_REPORT_KEY } from '@shared/constants/bulkExports'
import { exportBulk, exportFilter } from '../../src/main/services/exportService'
import { runFixtureCrawl, type FixtureCrawl } from '../fixtures/runFixtureCrawl'

let crawl: FixtureCrawl

beforeAll(async () => {
  crawl = await runFixtureCrawl((startUrl) => ({
    ...DEFAULT_CONFIG,
    startUrl,
    customSearches: [{ name: 'Marker', mode: 'contains', scope: 'html', pattern: 'CUSTOM-MARKER', regex: false }],
    customExtractions: [{ name: 'Price', type: 'css', selector: '.price', output: 'text', attribute: '' }]
  }))
})

afterAll(async () => {
  await crawl?.close()
})

describe('phase 2 checks on the fixture site', () => {
  it('reads the sitemap from robots.txt and finds orphans', () => {
    expect(crawl.paths('sitemaps:in-sitemap')).toEqual(['/', '/gone-from-sitemap', '/orphan'])
    expect(crawl.paths('sitemaps:orphan-urls')).toEqual(['/', '/gone-from-sitemap', '/orphan'])
    expect(crawl.paths('sitemaps:non-indexable-in-sitemap')).toEqual(['/gone-from-sitemap'])
  })

  it('checks hreflang', () => {
    expect(crawl.paths('hreflang:contains')).toEqual(['/en'])
    expect(crawl.paths('hreflang:incorrect-codes')).toEqual(['/en'])
    expect(crawl.paths('hreflang:missing-x-default')).toEqual(['/en'])
  })

  it('validates structured data', () => {
    expect(crawl.paths('structured-data:contains')).toEqual(['/products'])
    expect(crawl.paths('structured-data:parse-errors')).toEqual(['/products'])
    expect(crawl.paths('structured-data:rich-result-errors')).toEqual(['/products'])
    expect(crawl.paths('structured-data:json-ld')).toEqual(['/products'])
  })

  it('finds near duplicates', () => {
    expect(crawl.paths('content:near-duplicates')).toEqual(['/exact-a', '/exact-b', '/near-1', '/near-2'])
  })

  it('reads pagination', () => {
    expect(crawl.paths('pagination:first-page')).toEqual(['/list?page=1'])
    expect(crawl.paths('pagination:paginated-2-plus')).toEqual(['/list-2'])
  })

  it('runs custom search and extraction', () => {
    expect(crawl.paths('custom-search:filter-1')).toEqual(['/products'])
    expect(crawl.paths('custom-extraction:extractor-1')).toEqual(['/products'])
    const row = crawl.db.prepare("SELECT value FROM custom_values WHERE kind = 'extraction'").get() as { value: string }
    expect(row.value).toBe('19.99')
  })

  it('writes every bulk export and report as CSV and XLSX', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'seo-spider-export-'))
    try {
      for (const key of [...BULK_EXPORTS.map((b) => b.key), ISSUES_REPORT_KEY]) {
        await exportBulk(crawl.db, key, DEFAULT_CONFIG.thresholds, join(dir, `${key}.csv`))
        await exportBulk(crawl.db, key, DEFAULT_CONFIG.thresholds, join(dir, `${key}.xlsx`))
        expect(statSync(join(dir, `${key}.xlsx`)).size).toBeGreaterThan(0)
      }
      const inlinks4xx = readFileSync(join(dir, 'inlinks-4xx.csv'), 'utf8')
      expect(inlinks4xx).toContain('/does-not-exist')
      const issues = readFileSync(join(dir, `${ISSUES_REPORT_KEY}.csv`), 'utf8')
      expect(issues).toContain('Response Codes: Internal Client Error (4xx),Issue,High')
      const rows = await exportFilter(crawl.db, 'page-titles:all', DEFAULT_CONFIG.thresholds, join(dir, 'titles.xlsx'))
      expect(rows).toBeGreaterThan(10)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
