import { MAX_ROBOTS_CRAWL_DELAY_SECONDS } from '../constants/crawlDelay'

export function effectiveDelayMs(maxUrlsPerSecond: number, crawlDelaySeconds: number | null | undefined): number {
  const configured = maxUrlsPerSecond > 0 ? 1000 / maxUrlsPerSecond : 0
  const valid = typeof crawlDelaySeconds === 'number' && Number.isFinite(crawlDelaySeconds) && crawlDelaySeconds > 0
  const robots = valid ? Math.min(crawlDelaySeconds, MAX_ROBOTS_CRAWL_DELAY_SECONDS) * 1000 : 0
  return Math.max(configured, robots)
}
