export interface ExportRequest {
  crawlId: string
  filterKey?: string
  bulkKey?: string
}

export interface ExportResult {
  saved: boolean
  path: string | null
  rows: number
}
