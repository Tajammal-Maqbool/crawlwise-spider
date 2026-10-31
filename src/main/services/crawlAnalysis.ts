import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { normalizeUrl } from '@shared/utils/normalizeUrl'
import { openCrawlDb } from '../db/openCrawlDb'
import { runPostCrawlAnalysis } from '../crawler/postCrawlAnalysis'

export function reanalyseCrawl(dbPath: string, config: CrawlConfig, active: boolean): void {
  if (active) throw new Error('Pause or stop the crawl first.')
  const seed = normalizeUrl(config.mode === 'list' ? (config.listUrls[0] ?? '') : config.startUrl)
  const db = openCrawlDb(dbPath)
  try {
    runPostCrawlAnalysis(db, seed ? new URL(seed).hostname : '', config)
  } finally {
    db.close()
  }
}
