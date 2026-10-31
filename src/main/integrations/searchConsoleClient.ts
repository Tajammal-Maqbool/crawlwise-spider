import type { SearchConsoleOptions } from '@shared/interfaces/integrations'
import type { GoogleProperty } from '@shared/interfaces/googleAccount'
import type { GoogleApiContext } from '../interfaces/googleApi'
import type { InspectionResponse, SearchAnalyticsResponse, SearchAnalyticsRow, SitesResponse } from '../interfaces/searchConsoleApi'
import { searchConsoleDates } from '../utils/dateRange'
import { googleJson } from './googleRequest'

const ROW_LIMIT = 25000

export async function listSearchConsoleSites(google: GoogleApiContext): Promise<GoogleProperty[]> {
  const body = await googleJson<SitesResponse>(google, `${google.endpoints.searchConsole}/sites`)
  return (body.siteEntry ?? [])
    .filter((s) => s.permissionLevel !== 'siteUnverifiedUser')
    .map((s) => ({ id: s.siteUrl, name: s.siteUrl }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function querySearchAnalytics(google: GoogleApiContext, options: SearchConsoleOptions, now = new Date()): Promise<SearchAnalyticsRow[]> {
  const { startDate, endDate } = searchConsoleDates(options.dateRangeDays, now)
  const url = `${google.endpoints.searchConsole}/sites/${encodeURIComponent(options.siteUrl)}/searchAnalytics/query`
  const rows: SearchAnalyticsRow[] = []
  for (let startRow = 0; ; startRow += ROW_LIMIT) {
    const page = await googleJson<SearchAnalyticsResponse>(google, url, {
      startDate,
      endDate,
      dimensions: ['page'],
      type: options.searchType,
      rowLimit: ROW_LIMIT,
      startRow
    })
    const batch = page.rows ?? []
    for (const row of batch) rows.push(row)
    if (batch.length < ROW_LIMIT) return rows
  }
}

export function inspectUrl(google: GoogleApiContext, siteUrl: string, url: string): Promise<InspectionResponse> {
  return googleJson<InspectionResponse>(google, google.endpoints.urlInspection, { inspectionUrl: url, siteUrl })
}
