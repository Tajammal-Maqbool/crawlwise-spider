const clean = (value: unknown) => (value === null || value === undefined ? '' : String(value).replace(/[\t\r\n]+/g, ' '))

export function rowsToTsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(clean).join('\t')).join('\n')
}
