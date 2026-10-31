import type { AnalyticsOptions } from '@shared/interfaces/integrations'
import type { GoogleProperty } from '@shared/interfaces/googleAccount'
import type { GoogleApiContext } from '../interfaces/googleApi'
import type { AccountSummariesResponse, AnalyticsPageRow, RunReportResponse } from '../interfaces/analyticsApi'
import { GA4_METRICS } from '../constants/google'
import { googleJson } from './googleRequest'

const PAGE_LIMIT = 100000

export async function listAnalyticsProperties(google: GoogleApiContext): Promise<GoogleProperty[]> {
  const properties: GoogleProperty[] = []
  let pageToken = ''
  do {
    const query = new URLSearchParams({ pageSize: '200' })
    if (pageToken) query.set('pageToken', pageToken)
    const body = await googleJson<AccountSummariesResponse>(google, `${google.endpoints.analyticsAdmin}/accountSummaries?${query}`)
    for (const account of body.accountSummaries ?? []) {
      for (const p of account.propertySummaries ?? []) {
        properties.push({ id: p.property.replace(/^properties\//, ''), name: `${account.displayName ?? 'Account'} / ${p.displayName ?? p.property}` })
      }
    }
    pageToken = body.nextPageToken ?? ''
  } while (pageToken)
  return properties
}

export async function runAnalyticsReport(google: GoogleApiContext, options: AnalyticsOptions): Promise<AnalyticsPageRow[]> {
  const property = options.propertyId.trim().replace(/^properties\//, '')
  const url = `${google.endpoints.analyticsData}/properties/${encodeURIComponent(property)}:runReport`
  const rows: AnalyticsPageRow[] = []
  for (let offset = 0; ; offset += PAGE_LIMIT) {
    const page = await googleJson<RunReportResponse>(google, url, {
      dateRanges: [{ startDate: `${Math.max(1, Math.floor(options.dateRangeDays))}daysAgo`, endDate: 'yesterday' }],
      dimensions: [{ name: 'hostName' }, { name: 'pagePath' }],
      metrics: GA4_METRICS.map((name) => ({ name })),
      limit: PAGE_LIMIT,
      offset
    })
    for (const r of page.rows ?? []) {
      const m = r.metricValues.map((v) => Number(v.value) || 0)
      rows.push({
        host: r.dimensionValues[0]?.value ?? '',
        path: r.dimensionValues[1]?.value ?? '',
        sessions: m[0] ?? 0,
        users: m[1] ?? 0,
        views: m[2] ?? 0,
        engagementRate: m[3] ?? 0,
        avgDuration: m[4] ?? 0,
        bounceRate: m[5] ?? 0,
        keyEvents: m[6] ?? 0
      })
    }
    if (offset + PAGE_LIMIT >= (page.rowCount ?? 0)) return rows
  }
}
