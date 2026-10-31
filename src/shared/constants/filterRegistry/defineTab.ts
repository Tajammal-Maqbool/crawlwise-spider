import type { FilterDefinition, IssueMeta, TabDefinition } from '../../interfaces/filterDefinition'
import type { CrawlThresholds } from '../../interfaces/crawlConfig'

type Thresholded = string | ((t: CrawlThresholds) => string)

export interface FilterSpec {
  slug: string
  label: Thresholded
  where: Thresholded
  issue?: IssueMeta
}

export interface TabBundle {
  tab: TabDefinition
  filters: FilterDefinition[]
}

const resolve = (value: Thresholded, t: CrawlThresholds): string => (typeof value === 'string' ? value : value(t))

export function defineTab(tab: TabDefinition, specs: FilterSpec[]): TabBundle {
  const all: FilterSpec = { slug: 'all', label: 'All', where: '1 = 1' }
  const filters = [all, ...specs].map(
    (s): FilterDefinition => ({
      key: `${tab.key}:${s.slug}`,
      tabKey: tab.key,
      label: (t) => resolve(s.label, t),
      where: (t) => `(${tab.baseWhere}) AND (${resolve(s.where, t)})`,
      issue: s.issue
    })
  )
  return { tab, filters }
}
