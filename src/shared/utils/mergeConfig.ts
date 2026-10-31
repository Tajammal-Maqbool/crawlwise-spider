import { DEFAULT_CONFIG } from '../constants/defaultConfig'
import type { CrawlConfig } from '../interfaces/crawlConfig'

export function mergeConfig(stored: Partial<CrawlConfig>): CrawlConfig {
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    limits: { ...DEFAULT_CONFIG.limits, ...stored.limits },
    speed: { ...DEFAULT_CONFIG.speed, ...stored.speed },
    resources: { ...DEFAULT_CONFIG.resources, ...stored.resources },
    thresholds: { ...DEFAULT_CONFIG.thresholds, ...stored.thresholds },
    sitemaps: { ...DEFAULT_CONFIG.sitemaps, ...stored.sitemaps },
    content: { ...DEFAULT_CONFIG.content, ...stored.content },
    rendering: { ...DEFAULT_CONFIG.rendering, ...stored.rendering },
    integrations: {
      pagespeed: { ...DEFAULT_CONFIG.integrations.pagespeed, ...stored.integrations?.pagespeed },
      ai: { ...DEFAULT_CONFIG.integrations.ai, ...stored.integrations?.ai },
      searchConsole: { ...DEFAULT_CONFIG.integrations.searchConsole, ...stored.integrations?.searchConsole },
      analytics: { ...DEFAULT_CONFIG.integrations.analytics, ...stored.integrations?.analytics }
    },
    customSearches: stored.customSearches ?? [],
    customExtractions: stored.customExtractions ?? []
  }
}
