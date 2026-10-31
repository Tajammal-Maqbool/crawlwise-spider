import type { IssuePriority, IssueType } from '../types/issue'
import type { CrawlThresholds } from './crawlConfig'

export interface IssueMeta {
  type: IssueType
  priority: IssuePriority
  description: string
  howToFix: string
}

export interface FilterDefinition {
  key: string
  tabKey: string
  label: (t: CrawlThresholds) => string
  where: (t: CrawlThresholds) => string
  issue?: IssueMeta
}

export interface TabDefinition {
  key: string
  label: string
  group: string
  description: string
  baseWhere: string
  columns: string[]
}
