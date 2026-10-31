import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { CheckField } from '../common/CheckField'
import { NumberField } from '../common/NumberField'

export function ContentSection({ config, onChange }: ConfigSectionProps) {
  const set = (patch: Partial<typeof config.content>) => onChange({ ...config, content: { ...config.content, ...patch } })
  return (
    <div className="config-section">
      <h3>Content</h3>
      <CheckField label="Enable Near Duplicates" checked={config.content.nearDuplicates} onChange={(v) => set({ nearDuplicates: v })} />
      <NumberField
        label="Near Duplicate Similarity Threshold (%)"
        value={config.content.nearDuplicateThreshold}
        min={50}
        onChange={(v) => set({ nearDuplicateThreshold: Math.min(100, Math.max(50, v)) })}
      />
      <CheckField label="Store HTML (for View Source)" checked={config.content.storeHtml} onChange={(v) => set({ storeHtml: v })} />
    </div>
  )
}
