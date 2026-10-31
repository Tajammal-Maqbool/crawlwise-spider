export interface SearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[]
}

export interface SitesResponse {
  siteEntry?: Array<{ siteUrl: string; permissionLevel: string }>
}

export interface IndexStatusResult {
  verdict?: string
  coverageState?: string
  robotsTxtState?: string
  indexingState?: string
  lastCrawlTime?: string
  pageFetchState?: string
  googleCanonical?: string
  userCanonical?: string
  crawledAs?: string
}

export interface InspectionResponse {
  inspectionResult?: {
    indexStatusResult?: IndexStatusResult
    richResultsResult?: { verdict?: string }
  }
}

export interface SearchMetrics {
  clicks: number
  impressions: number
  positionSum: number
}
