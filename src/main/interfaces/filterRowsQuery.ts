import type { StatementSync } from 'node:sqlite'

export interface FilterRowsQuery {
  columns: string[]
  tabLabel: string
  statement: StatementSync
}
