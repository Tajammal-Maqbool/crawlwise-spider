import type { CrawlMode, CrawlState } from '../types/crawlState'

export interface CrawlSummary {
  id: string
  startUrl: string
  mode: CrawlMode
  state: CrawlState
  createdAt: string
  urlCount: number
  fileSizeBytes: number
}
