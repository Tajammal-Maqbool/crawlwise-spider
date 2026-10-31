import type { DatabaseSync } from 'node:sqlite'
import { FILTERS } from '@shared/constants/filterRegistry'
import type { CrawlThresholds } from '@shared/interfaces/crawlConfig'
import type { ChangeRow, DiffCategory, FieldChange, FilterDiff } from '@shared/interfaces/crawlComparison'

const CHANGE_FIELDS: Record<string, string> = {
  'Page Titles': 'title',
  'Meta Description': 'meta_description',
  H1: 'h1_1',
  'Word Count': 'word_count',
  'Crawl Depth': 'depth',
  Indexability: 'indexability',
  'Unique Inlinks': 'unique_inlinks',
  'Unique Internal Outlinks': 'unique_outlinks',
  'Unique External Outlinks': 'unique_external_outlinks',
  'Status Code': 'status_code',
  'Canonical': 'canonical',
  'Structured Data Unique Types': 'sd_types',
  Content: 'hash'
}

const PAGES = "state = 3 AND is_internal = 1 AND kind = 'html'"

function urlSet(db: DatabaseSync, where: string): Set<string> {
  return new Set((db.prepare(`SELECT u.url FROM urls u WHERE ${where}`).all() as Array<{ url: string }>).map((r) => r.url))
}

function allUrls(db: DatabaseSync): Set<string> {
  return urlSet(db, 'u.state = 3')
}

export function diffUrls(current: DatabaseSync, previous: DatabaseSync, filterWhere: string): Record<DiffCategory, string[]> {
  const cur = urlSet(current, filterWhere)
  const prev = urlSet(previous, filterWhere)
  const prevAll = allUrls(previous)
  const curAll = allUrls(current)
  const result: Record<DiffCategory, string[]> = { new: [], added: [], removed: [], missing: [] }
  for (const u of cur) if (!prev.has(u)) result[prevAll.has(u) ? 'added' : 'new'].push(u)
  for (const u of prev) if (!cur.has(u)) result[curAll.has(u) ? 'removed' : 'missing'].push(u)
  return result
}

export function compareFilters(current: DatabaseSync, previous: DatabaseSync, thresholds: CrawlThresholds): FilterDiff[] {
  const curAll = allUrls(current)
  const prevAll = allUrls(previous)
  return FILTERS.map((f) => {
    const where = f.where(thresholds)
    const cur = urlSet(current, where)
    const prev = urlSet(previous, where)
    const diff: FilterDiff = { filterKey: f.key, current: cur.size, previous: prev.size, new: 0, added: 0, removed: 0, missing: 0 }
    for (const u of cur) if (!prev.has(u)) diff[prevAll.has(u) ? 'added' : 'new'] += 1
    for (const u of prev) if (!cur.has(u)) diff[curAll.has(u) ? 'removed' : 'missing'] += 1
    return diff
  })
}

export function compareFields(current: DatabaseSync, previous: DatabaseSync): FieldChange[] {
  return Object.keys(CHANGE_FIELDS).map((field) => ({ field, count: fieldChanges(current, previous, field).length }))
}

export function fieldChanges(current: DatabaseSync, previous: DatabaseSync, field: string): ChangeRow[] {
  const column = CHANGE_FIELDS[field]
  if (!column) throw new Error(`Unknown change field: ${field}`)
  const read = (db: DatabaseSync) =>
    new Map((db.prepare(`SELECT url, ${column} AS v FROM urls WHERE ${PAGES}`).all() as Array<{ url: string; v: unknown }>).map((r) => [r.url, r.v]))
  const prev = read(previous)
  const rows: ChangeRow[] = []
  for (const [url, value] of read(current)) {
    if (!prev.has(url)) continue
    const before = prev.get(url)
    if ((before ?? null) !== (value ?? null)) rows.push({ url, previous: String(before ?? ''), current: String(value ?? '') })
  }
  return rows
}
