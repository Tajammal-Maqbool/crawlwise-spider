import type { InspectionResponse } from '../interfaces/searchConsoleApi'
import type { SqlValue } from '../types/sqlValue'

export function inspectionFields(response: InspectionResponse): Record<string, SqlValue> {
  const index = response.inspectionResult?.indexStatusResult ?? {}
  return {
    gsc_inspection_status: 'Success',
    gsc_verdict: index.verdict ?? null,
    gsc_coverage: index.coverageState ?? null,
    gsc_indexing_state: index.indexingState ?? null,
    gsc_robots_state: index.robotsTxtState ?? null,
    gsc_fetch_state: index.pageFetchState ?? null,
    gsc_last_crawl: index.lastCrawlTime ?? null,
    gsc_crawled_as: index.crawledAs ?? null,
    gsc_google_canonical: index.googleCanonical ?? null,
    gsc_user_canonical: index.userCanonical ?? null,
    gsc_rich_verdict: response.inspectionResult?.richResultsResult?.verdict ?? null
  }
}
