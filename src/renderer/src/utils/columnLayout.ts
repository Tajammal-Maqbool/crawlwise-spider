import type { ColumnState } from '../interfaces/columnLayout'

export function mergeColumnLayout(stored: ColumnState[], tabColumns: string[], defaultWidth: (key: string) => number): ColumnState[] {
  const known = new Set(tabColumns)
  const kept = stored.filter((c) => known.has(c.key))
  const seen = new Set(kept.map((c) => c.key))
  const added = tabColumns.filter((k) => !seen.has(k)).map((key) => ({ key, width: defaultWidth(key), visible: true }))
  return [...kept, ...added]
}

export function moveColumn(columns: ColumnState[], key: string, beforeKey: string): ColumnState[] {
  if (key === beforeKey) return columns
  const moving = columns.find((c) => c.key === key)
  if (!moving) return columns
  const rest = columns.filter((c) => c.key !== key)
  const index = rest.findIndex((c) => c.key === beforeKey)
  rest.splice(index < 0 ? rest.length : index, 0, moving)
  return rest
}

export function toggleColumn(columns: ColumnState[], key: string): ColumnState[] {
  const visibleCount = columns.filter((c) => c.visible).length
  return columns.map((c) => (c.key === key && !(c.visible && visibleCount === 1) ? { ...c, visible: !c.visible } : c))
}
