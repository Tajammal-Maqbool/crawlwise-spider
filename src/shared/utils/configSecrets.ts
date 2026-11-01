import type { CrawlConfig } from '../interfaces/crawlConfig'
import type { StoredSecrets } from '../interfaces/storedSecrets'
import { redactSecrets } from './redactSecrets'

export function extractSecrets(config: Partial<CrawlConfig>): StoredSecrets {
  return {
    pagespeedApiKey: config.integrations?.pagespeed?.apiKey ?? '',
    aiApiKey: config.integrations?.ai?.apiKey ?? ''
  }
}

export function hasSecrets(secrets: StoredSecrets): boolean {
  return !!(secrets.pagespeedApiKey || secrets.aiApiKey)
}

export function mergeSecrets(config: CrawlConfig, secrets: StoredSecrets): CrawlConfig {
  return {
    ...config,
    integrations: {
      ...config.integrations,
      pagespeed: { ...config.integrations.pagespeed, apiKey: secrets.pagespeedApiKey },
      ai: { ...config.integrations.ai, apiKey: secrets.aiApiKey }
    }
  }
}

export const stripSecrets = redactSecrets
