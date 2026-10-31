import { normalizeUrl } from '@shared/utils/normalizeUrl'
import type { SearchAnalyticsRow, SearchMetrics } from '../interfaces/searchConsoleApi'

export function aggregateSearchRows(rows: SearchAnalyticsRow[]): Map<string, SearchMetrics> {
  const byUrl = new Map<string, SearchMetrics>()
  for (const row of rows) {
    const url = normalizeUrl(row.keys[0] ?? '')
    if (!url) continue
    const m = byUrl.get(url) ?? { clicks: 0, impressions: 0, positionSum: 0 }
    m.clicks += row.clicks
    m.impressions += row.impressions
    m.positionSum += row.position * row.impressions
    byUrl.set(url, m)
  }
  return byUrl
}
