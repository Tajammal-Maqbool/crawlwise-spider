import type { IssuePriority, IssueType } from '@shared/types/issue'

export const ISSUE_TYPE_ORDER: Record<IssueType, number> = { Issue: 0, Warning: 1, Opportunity: 2 }

export const ISSUE_PRIORITY_ORDER: Record<IssuePriority, number> = { High: 0, Medium: 1, Low: 2 }
