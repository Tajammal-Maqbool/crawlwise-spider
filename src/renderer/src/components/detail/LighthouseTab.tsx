import type { DetailTabProps } from '../../interfaces/detailProps'
import { DataTable } from '../common/DataTable'
import { LIGHTHOUSE_LABELS } from '../../constants/lighthouseLabels'

export function LighthouseTab({ detail }: DetailTabProps) {
  const rows = detail.fields.filter((f) => LIGHTHOUSE_LABELS.has(f.label)).map((f) => [f.label, f.value])
  return <DataTable headers={['Metric', 'Value']} rows={rows} empty="No PageSpeed data. Turn on PageSpeed Insights in API Access." />
}
