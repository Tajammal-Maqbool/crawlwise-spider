import type { DetailTabProps } from '../../interfaces/detailProps'
import { DataTable } from '../common/DataTable'

export function AccessibilityTab({ detail }: DetailTabProps) {
  return (
    <DataTable
      headers={['Issue', 'Impact', 'Guidelines', 'Elements', 'Help']}
      rows={detail.accessibility.map((a) => [a.rule, a.impact ?? '', a.tags.split(',').filter(Boolean).join(', '), String(a.nodes), a.help ?? ''])}
      empty="No accessibility violations. Accessibility needs JavaScript rendering with axe-core on."
    />
  )
}
