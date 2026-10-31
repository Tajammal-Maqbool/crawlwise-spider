import type { CrawlConfig } from '../interfaces/crawlConfig'

export function redactSecrets(config: CrawlConfig): CrawlConfig {
  return {
    ...config,
    integrations: {
      ...config.integrations,
      pagespeed: { ...config.integrations.pagespeed, apiKey: '' },
      ai: { ...config.integrations.ai, apiKey: '' }
    }
  }
}
