import type { CrawlConfig } from '@shared/interfaces/crawlConfig'

export interface StoredConfigState {
  config: CrawlConfig
  setConfig: (config: CrawlConfig) => void
  secretsPersistent: boolean
}
