import { neutralizeFormula } from './neutralizeFormula'

export const CSV_BOM = '﻿'
export const CSV_EOL = '\r\n'

export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header, ...rows].map(csvLine)
  return `${CSV_BOM}${lines.join(CSV_EOL)}${CSV_EOL}`
}

export function csvLine(row: unknown[]): string {
  return row.map(csvCell).join(',')
}

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(neutralizeFormula(value))
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
