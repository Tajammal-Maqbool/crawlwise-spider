import type { SortDirection } from '../types/sortDirection'

export interface GridQuery {
  crawlId: string
  filterKey: string
  sortKey: string | null
  sortDirection: SortDirection
  search: string
  offset: number
  limit: number
}

export interface GridPage {
  columns: string[]
  rows: Array<Record<string, unknown>>
  total: number
}
