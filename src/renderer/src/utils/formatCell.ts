import type { ColumnFormat } from '@shared/types/columnFormat'

export function formatCell(value: unknown, format: ColumnFormat): string {
  if (value === null || value === undefined) return ''
  if (format === 'number' && typeof value === 'number') return value.toLocaleString()
  if (format === 'bytes' && typeof value === 'number') return value.toLocaleString()
  if (format === 'ms' && typeof value === 'number') return `${(value / 1000).toFixed(3)}`
  return String(value)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
