import type { DatabaseSync } from 'node:sqlite'
import { FILTERS, FILTERS_BY_KEY, TABS_BY_KEY } from '@shared/constants/filterRegistry'
import { COLUMNS } from '@shared/constants/columns'
import type { CrawlThresholds } from '@shared/interfaces/crawlConfig'
import type { FilterCounts } from '@shared/interfaces/filterCount'
import type { GridPage, GridQuery } from '@shared/interfaces/gridQuery'

export function countFilters(db: DatabaseSync, thresholds: CrawlThresholds): FilterCounts {
  const counts: FilterCounts = {}
  for (const f of FILTERS) {
    const row = db.prepare(`SELECT count(*) AS n FROM urls u WHERE ${f.where(thresholds)}`).get() as { n: number }
    counts[f.key] = row.n
  }
  return counts
}

export function queryPage(db: DatabaseSync, query: GridQuery, thresholds: CrawlThresholds): GridPage {
  const filter = FILTERS_BY_KEY[query.filterKey]
  if (!filter) throw new Error(`Unknown filter: ${query.filterKey}`)
  const columns = TABS_BY_KEY[filter.tabKey].columns
  const select = columns.map((k) => `${COLUMNS[k].sql} AS "${k}"`).join(', ')
  const params: string[] = []
  let where = filter.where(thresholds)
  if (query.search.trim()) {
    where = `(${where}) AND u.url LIKE ?`
    params.push(`%${query.search.trim()}%`)
  }
  const sortColumn = query.sortKey && columns.includes(query.sortKey) ? `"${query.sortKey}"` : 'u.id'
  const direction = query.sortDirection === 'desc' ? 'DESC' : 'ASC'
  const total = (db.prepare(`SELECT count(*) AS n FROM urls u WHERE ${where}`).get(...params) as { n: number }).n
  const rows = db
    .prepare(`SELECT u.id AS "__id", ${select} FROM urls u WHERE ${where} ORDER BY ${sortColumn} ${direction} NULLS LAST LIMIT ? OFFSET ?`)
    .all(...params, query.limit, query.offset) as Array<Record<string, unknown>>
  return { columns, rows, total }
}

export function queryAllRows(db: DatabaseSync, filterKey: string, thresholds: CrawlThresholds): GridPage {
  const filter = FILTERS_BY_KEY[filterKey]
  if (!filter) throw new Error(`Unknown filter: ${filterKey}`)
  const columns = TABS_BY_KEY[filter.tabKey].columns
  const select = columns.map((k) => `${COLUMNS[k].sql} AS "${k}"`).join(', ')
  const rows = db.prepare(`SELECT ${select} FROM urls u WHERE ${filter.where(thresholds)} ORDER BY u.id`).all() as Array<Record<string, unknown>>
  return { columns, rows, total: rows.length }
}
