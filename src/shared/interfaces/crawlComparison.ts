export type DiffCategory = 'new' | 'added' | 'removed' | 'missing'

export interface FilterDiff {
  filterKey: string
  current: number
  previous: number
  new: number
  added: number
  removed: number
  missing: number
}

export interface FieldChange {
  field: string
  count: number
}

export interface CrawlComparison {
  currentId: string
  previousId: string
  filters: FilterDiff[]
  changes: FieldChange[]
}

export interface ChangeRow {
  url: string
  previous: string
  current: string
}
