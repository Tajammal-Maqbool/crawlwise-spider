import type { ColumnFormat } from '../types/columnFormat'

export interface ColumnDefinition {
  key: string
  label: string
  sql: string
  format: ColumnFormat
  width: number
}
