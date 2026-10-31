import type { DatabaseSync } from 'node:sqlite'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { INTERNAL_HTML_2XX } from '@shared/constants/filterRegistry/bases'
import { UrlRepository } from '../db/urlRepository'
import { readMeta, writeMeta } from '../db/metaRepository'
import { inTransaction } from '../db/inTransaction'
import type { GoogleApiContext } from '../interfaces/googleApi'
import type { SearchAnalyticsRow } from '../interfaces/searchConsoleApi'
import type { AnalyticsPageRow } from '../interfaces/analyticsApi'
import { aggregateSearchRows } from '../utils/aggregateSearchRows'
import { analyticsUrlCandidates } from '../utils/analyticsUrlCandidates'
import { errorText } from '../utils/errorText'
import { querySearchAnalytics } from './searchConsoleClient'
import { runAnalyticsReport } from './analyticsClient'

export type IntegrationUrlResolver = (url: string, foundVia: string, crawl: boolean) => number | null

export async function importGoogleData(
  db: DatabaseSync,
  config: CrawlConfig,
  google: GoogleApiContext,
  startUrl: string,
  resolve: IntegrationUrlResolver,
  progress: (message: string) => void
): Promise<string[]> {
  const warnings: string[] = []
  const { searchConsole, analytics } = config.integrations
  if (searchConsole.enabled) {
    if (!searchConsole.siteUrl.trim()) warnings.push('Search Console: choose a property in API Access')
    else {
      try {
        progress('Search Console: fetching search analytics')
        const rows = await querySearchAnalytics(google, searchConsole)
        inTransaction(db, () => storeSearchAnalytics(db, rows, searchConsole.crawlNewUrls, resolve))
        writeMeta(db, 'gsc_imported', '1')
      } catch (err) {
        warnings.push(`Search Console: ${errorText(err)}`)
      }
    }
  }
  if (analytics.enabled) {
    if (!analytics.propertyId.trim()) warnings.push('GA4: choose a property in API Access')
    else {
      try {
        progress('GA4: fetching page metrics')
        const rows = await runAnalyticsReport(google, analytics)
        inTransaction(db, () => storeAnalytics(db, rows, startUrl, analytics.crawlNewUrls, resolve))
        writeMeta(db, 'ga_imported', '1')
      } catch (err) {
        warnings.push(`GA4: ${errorText(err)}`)
      }
    }
  }
  progress('')
  return warnings
}

export function markMissingGoogleData(db: DatabaseSync): void {
  const pages = INTERNAL_HTML_2XX('urls')
  if (readMeta(db, 'gsc_imported') === '1') db.exec(`UPDATE urls SET gsc_has_data = 0 WHERE gsc_has_data IS NULL AND ${pages}`)
  if (readMeta(db, 'ga_imported') === '1') db.exec(`UPDATE urls SET ga_has_data = 0 WHERE ga_has_data IS NULL AND ${pages}`)
}

function storeSearchAnalytics(db: DatabaseSync, rows: SearchAnalyticsRow[], crawl: boolean, resolve: IntegrationUrlResolver): void {
  const urls = new UrlRepository(db)
  for (const [url, m] of aggregateSearchRows(rows)) {
    const id = resolve(url, 'Search Console', crawl)
    if (id === null) continue
    urls.update(id, {
      gsc_has_data: 1,
      gsc_clicks: m.clicks,
      gsc_impressions: m.impressions,
      gsc_ctr: m.impressions > 0 ? m.clicks / m.impressions : 0,
      gsc_position: m.impressions > 0 ? m.positionSum / m.impressions : null
    })
  }
}

function storeAnalytics(db: DatabaseSync, rows: AnalyticsPageRow[], startUrl: string, crawl: boolean, resolve: IntegrationUrlResolver): void {
  const urls = new UrlRepository(db)
  for (const row of rows) {
    const candidates = analyticsUrlCandidates(row.host, row.path, startUrl)
    if (candidates.length === 0) continue
    const url = candidates.find((c) => urls.find(c)) ?? candidates[0]
    const id = resolve(url, 'Google Analytics', crawl)
    if (id === null) continue
    urls.update(id, {
      ga_has_data: 1,
      ga_sessions: row.sessions,
      ga_users: row.users,
      ga_views: row.views,
      ga_engagement_rate: row.engagementRate,
      ga_avg_duration: row.avgDuration,
      ga_bounce_rate: row.bounceRate,
      ga_key_events: row.keyEvents
    })
  }
}
