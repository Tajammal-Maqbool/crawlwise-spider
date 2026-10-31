import type { AnalyticsOptions } from '@shared/interfaces/integrations'
import type { GoogleSectionProps } from '../../interfaces/googleProps'
import { CheckField } from '../common/CheckField'
import { ComboField } from '../common/ComboField'
import { NumberField } from '../common/NumberField'

export function AnalyticsSettings({ config, onChange, google }: GoogleSectionProps) {
  const options = config.integrations.analytics
  const set = (patch: Partial<AnalyticsOptions>) => onChange({ ...config, integrations: { ...config.integrations, analytics: { ...options, ...patch } } })

  return (
    <>
      <h3>Google Analytics 4</h3>
      <CheckField label="Import GA4 data for this crawl" checked={options.enabled} onChange={(v) => set({ enabled: v })} />
      <ComboField
        label="Property ID"
        hint="The numeric GA4 property ID"
        value={options.propertyId}
        options={google.properties}
        loadLabel="Load Properties"
        loading={google.busy || !google.status?.connected}
        onLoad={() => void google.loadProperties()}
        onChange={(v) => set({ propertyId: v })}
      />
      <NumberField label="Date Range (Days)" value={options.dateRangeDays} min={1} onChange={(v) => set({ dateRangeDays: v })} />
      <CheckField label="Crawl new URLs found in GA4" checked={options.crawlNewUrls} onChange={(v) => set({ crawlNewUrls: v })} />
    </>
  )
}
