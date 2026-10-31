import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { CrawlProgress } from '@shared/interfaces/crawlProgress'
import { queryAllRows } from '../../src/main/db/queryService'
import { openCrawlDb } from '../../src/main/db/openCrawlDb'
import { CrawlEngine } from '../../src/main/crawler/engine'
import { startFixtureSite, type FixtureSite } from './fixtureSite'
import type { PageRenderer } from '../../src/main/interfaces/renderResult'
import type { GoogleApiContext } from '../../src/main/interfaces/googleApi'

export interface FixtureCrawl {
  site: FixtureSite
  db: DatabaseSync
  result: CrawlProgress
  paths: (filterKey: string) => string[]
  close: () => Promise<void>
}

export async function runFixtureCrawl(
  makeConfig: (startUrl: string) => CrawlConfig,
  renderer: PageRenderer | null = null,
  google: GoogleApiContext | null = null
): Promise<FixtureCrawl> {
  const site = await startFixtureSite()
  const dir = mkdtempSync(join(tmpdir(), 'seo-spider-test-'))
  const db = openCrawlDb(join(dir, 'crawl.sqlite'))
  const config = makeConfig(site.url)
  const result = await new CrawlEngine(db, config, 'test', () => undefined, () => 0, renderer, google).run(false)
  if (result.state !== 'completed') throw new Error(`Crawl ended in state ${result.state}: ${result.message}`)
  return {
    site,
    db,
    result,
    paths: (filterKey) =>
      queryAllRows(db, filterKey, config.thresholds)
        .rows.map((r) => {
          const u = new URL(String(r.address))
          return `${u.pathname}${u.search}`
        })
        .sort(),
    close: async () => {
      db.close()
      await site.close()
      rmSync(dir, { recursive: true, force: true })
    }
  }
}
