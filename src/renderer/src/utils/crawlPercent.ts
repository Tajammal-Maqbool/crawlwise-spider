import type { CrawlProgress } from '@shared/interfaces/crawlProgress'

export function crawlPercent(progress: CrawlProgress | null): number {
  if (!progress) return 0
  if (progress.state === 'completed') return 100
  const total = progress.crawled + progress.queued
  return total > 0 ? Math.floor((progress.crawled / total) * 100) : 0
}
