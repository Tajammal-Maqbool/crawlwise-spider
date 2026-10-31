import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { CrawlProgress } from '@shared/interfaces/crawlProgress'
import type { RenderResult } from './renderResult'
import type { GoogleEndpoints } from './googleEndpoints'

export interface CrawlWorkerData {
  crawlId: string
  dbPath: string
  config: CrawlConfig
  resume: boolean
  googleEndpoints: GoogleEndpoints
}

export type WorkerCommand =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'rendered'; requestId: number; result: RenderResult | null }
  | { type: 'google-token'; requestId: number; token: string | null; error: string | null }

export type WorkerEvent =
  | { type: 'progress'; progress: CrawlProgress }
  | { type: 'finished'; progress: CrawlProgress }
  | { type: 'error'; message: string }
  | { type: 'render'; requestId: number; url: string }
  | { type: 'google-token'; requestId: number }
