import type { CrawlState } from '../types/crawlState'

export interface CrawlProgress {
  crawlId: string
  state: CrawlState
  crawled: number
  queued: number
  discovered: number
  urlsPerSecond: number
  activeThreads: number
  dbSizeBytes: number
  message: string | null
}
