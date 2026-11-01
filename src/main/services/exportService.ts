import type { DatabaseSync } from 'node:sqlite'
import { COLUMNS } from '@shared/constants/columns'
import { BULK_EXPORTS, ISSUES_REPORT_KEY } from '@shared/constants/bulkExports'
import { FILTERS, FILTERS_BY_KEY, TABS_BY_KEY } from '@shared/constants/filterRegistry'
import type { CrawlThresholds } from '@shared/interfaces/crawlConfig'
import { countFilters, prepareFilterRows } from '../db/queryService'
import { countedRows } from '../utils/countedRows'
import { writeTable } from './tableWriter'

export async function exportFilter(db: DatabaseSync, filterKey: string, thresholds: CrawlThresholds, path: string): Promise<number> {
  const { columns, tabLabel, statement } = prepareFilterRows(db, filterKey, thresholds)
  const counter = countedRows(statement.iterate() as Iterable<Record<string, unknown>>, (r) => columns.map((k) => r[k]))
  await writeTable(path, tabLabel, columns.map((k) => COLUMNS[k].label), counter.rows)
  return counter.count()
}

export async function exportBulk(db: DatabaseSync, key: string, thresholds: CrawlThresholds, path: string): Promise<number> {
  if (key === ISSUES_REPORT_KEY) return exportIssues(db, thresholds, path)
  const def = BULK_EXPORTS.find((b) => b.key === key)
  if (!def) throw new Error(`Unknown export: ${key}`)
  const counter = countedRows(db.prepare(def.sql).iterate() as Iterable<Record<string, unknown>>, (r) => Object.values(r))
  await writeTable(path, def.label, def.header, counter.rows)
  return counter.count()
}

async function exportIssues(db: DatabaseSync, thresholds: CrawlThresholds, path: string): Promise<number> {
  const counts = countFilters(db, thresholds)
  const rows = FILTERS.filter((f) => f.issue && counts[f.key] > 0).map((f) => [
    `${TABS_BY_KEY[f.tabKey].label}: ${f.label(thresholds)}`,
    f.issue!.type,
    f.issue!.priority,
    counts[f.key],
    f.issue!.description,
    f.issue!.howToFix
  ])
  await writeTable(path, 'Issues', ['Issue Name', 'Issue Type', 'Issue Priority', 'URLs', 'Description', 'How To Fix'], rows)
  return rows.length
}

export function defaultExportName(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function filterExportLabel(filterKey: string, thresholds: CrawlThresholds): string {
  const filter = FILTERS_BY_KEY[filterKey]
  return `${TABS_BY_KEY[filter.tabKey].label} ${filter.label(thresholds)}`
}
