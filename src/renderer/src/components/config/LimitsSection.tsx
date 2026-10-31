import type { CrawlLimits } from '@shared/interfaces/crawlConfig'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { NumberField } from '../common/NumberField'

export function LimitsSection({ config, onChange }: ConfigSectionProps) {
  const set = (key: keyof CrawlLimits, value: number) => onChange({ ...config, limits: { ...config.limits, [key]: value } })
  return (
    <div className="config-section">
      <h3>Limits</h3>
      <NumberField label="Limit Crawl Total" value={config.limits.maxUrls} min={1} onChange={(v) => set('maxUrls', v)} />
      <NumberField label="Limit Crawl Depth" hint="-1 means no limit" value={config.limits.maxDepth} min={-1} onChange={(v) => set('maxDepth', v)} />
      <NumberField label="Limit Max URL Length" value={config.limits.maxUrlLength} min={1} onChange={(v) => set('maxUrlLength', v)} />
      <NumberField label="Limit Max Page Size (KB)" value={config.limits.maxPageSizeKb} min={1} onChange={(v) => set('maxPageSizeKb', v)} />
      <NumberField label="Response Timeout (seconds)" value={config.responseTimeoutMs / 1000} min={1} onChange={(v) => onChange({ ...config, responseTimeoutMs: v * 1000 })} />
    </div>
  )
}
