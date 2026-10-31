import type { DatabaseSync } from 'node:sqlite'
import { FILTERS_BY_KEY } from '@shared/constants/filterRegistry'
import type { CrawlThresholds } from '@shared/interfaces/crawlConfig'
import type { TreeRow } from '@shared/interfaces/treeRow'

export const TREE_LEVEL_LIMIT = 500

export function getTreeRows(db: DatabaseSync, filterKey: string, thresholds: CrawlThresholds, parentPath: string, limit = TREE_LEVEL_LIMIT): TreeRow[] {
  const filter = FILTERS_BY_KEY[filterKey]
  if (!filter) throw new Error(`Unknown filter ${filterKey}`)
  const urls = db
    .prepare(`SELECT u.id, u.url FROM urls u WHERE (${filter.where(thresholds)}) AND substr(u.url, 1, ?) = ?`)
    .all(parentPath.length, parentPath) as Array<{ id: number; url: string }>
  const folders = new Map<string, number>()
  const leaves: TreeRow[] = []
  for (const u of urls) {
    const child = childPath(u.url, parentPath)
    if (child === null) leaves.push({ path: u.url, label: u.url.slice(parentPath.length) || '/', isFolder: false, urls: 1, urlId: u.id })
    else folders.set(child, (folders.get(child) ?? 0) + 1)
  }
  const folderRows = [...folders]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, n]): TreeRow => ({ path, label: path.slice(parentPath.length), isFolder: true, urls: n, urlId: null }))
  return [...folderRows, ...leaves.sort((a, b) => a.path.localeCompare(b.path))].slice(0, limit)
}

function childPath(url: string, parent: string): string | null {
  if (!parent) return `${new URL(url).origin}/`
  const rest = url.slice(parent.length).split(/[?#]/)[0]
  const slash = rest.indexOf('/')
  return slash < 0 ? null : `${parent}${rest.slice(0, slash + 1)}`
}
