import type { DetailTabProps } from '../../interfaces/detailProps'
import { DataTable } from '../common/DataTable'

export function DuplicatesTab({ detail }: DetailTabProps) {
  return <DataTable headers={['Address', 'Similarity']} rows={detail.duplicates.map((d) => [d.url, `${d.similarity}%`])} empty="No near duplicates for this URL." />
}
