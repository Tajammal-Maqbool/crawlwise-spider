export interface RunReportResponse {
  rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>
  rowCount?: number
}

export interface AccountSummariesResponse {
  accountSummaries?: Array<{ displayName?: string; propertySummaries?: Array<{ property: string; displayName?: string }> }>
  nextPageToken?: string
}

export interface AnalyticsPageRow {
  host: string
  path: string
  sessions: number
  users: number
  views: number
  engagementRate: number
  avgDuration: number
  bounceRate: number
  keyEvents: number
}
