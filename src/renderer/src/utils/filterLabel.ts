import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { FilterDefinition } from '@shared/interfaces/filterDefinition'

export function filterLabel(filter: FilterDefinition, config: CrawlConfig): string {
  const ai = /^ai:prompt-(\d+)$/.exec(filter.key)
  if (ai) {
    const name = config.integrations.ai.prompts[Number(ai[1]) - 1]?.name
    if (name) return name
  }
  const slot = /^custom-(search|extraction):(?:filter|extractor)-(\d+)$/.exec(filter.key)
  if (slot) {
    const rules = slot[1] === 'search' ? config.customSearches : config.customExtractions
    const name = rules[Number(slot[2]) - 1]?.name
    if (name) return name
  }
  return filter.label(config.thresholds)
}
