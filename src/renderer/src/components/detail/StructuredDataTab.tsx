import type { DetailTabProps } from '../../interfaces/detailProps'
import { DataTable } from '../common/DataTable'

export function StructuredDataTab({ detail }: DetailTabProps) {
  return (
    <DataTable
      headers={['Format', 'Type', 'Errors', 'Warnings']}
      rows={detail.structuredData.map((s) => [s.format, s.type ?? '', s.errors ?? '', s.warnings ?? ''])}
      empty="No structured data on this URL."
    />
  )
}
