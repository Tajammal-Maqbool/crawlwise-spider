import type { IssueMeta } from '../../interfaces/filterDefinition'
import type { IssuePriority, IssueType } from '../../types/issue'

export const issue = (type: IssueType, priority: IssuePriority, description: string, howToFix: string): IssueMeta => ({
  type, priority, description, howToFix
})
