import type { CrawlState } from '@shared/types/crawlState'

const INTERRUPTED_STATES = new Set<string>(['crawling', 'analysing'])

export function recoverStaleState(state: string, isLive: boolean): CrawlState {
  return !isLive && INTERRUPTED_STATES.has(state) ? 'paused' : (state as CrawlState)
}
