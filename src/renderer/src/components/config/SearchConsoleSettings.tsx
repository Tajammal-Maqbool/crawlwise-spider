import type { SearchConsoleOptions, SearchType } from '@shared/interfaces/integrations'
import type { GoogleSectionProps } from '../../interfaces/googleProps'
import { SEARCH_TYPE_OPTIONS } from '../../constants/integrationOptions'
import { CheckField } from '../common/CheckField'
import { ComboField } from '../common/ComboField'
import { NumberField } from '../common/NumberField'
import { SelectField } from '../common/SelectField'

export function SearchConsoleSettings({ config, onChange, google }: GoogleSectionProps) {
  const options = config.integrations.searchConsole
  const set = (patch: Partial<SearchConsoleOptions>) =>
    onChange({ ...config, integrations: { ...config.integrations, searchConsole: { ...options, ...patch } } })

  return (
    <>
      <h3>Search Console</h3>
      <CheckField label="Import Search Console data for this crawl" checked={options.enabled} onChange={(v) => set({ enabled: v })} />
      <ComboField
        label="Property"
        hint="For example https://example.com/ or sc-domain:example.com"
        value={options.siteUrl}
        options={google.sites}
        loadLabel="Load Properties"
        loading={google.busy || !google.status?.connected}
        onLoad={() => void google.loadSites()}
        onChange={(v) => set({ siteUrl: v })}
      />
      <NumberField label="Date Range (Days)" value={options.dateRangeDays} min={1} onChange={(v) => set({ dateRangeDays: v })} />
      <SelectField<SearchType> label="Search Type" value={options.searchType} options={SEARCH_TYPE_OPTIONS} onChange={(v) => set({ searchType: v })} />
      <CheckField label="Crawl new URLs found in Search Console" checked={options.crawlNewUrls} onChange={(v) => set({ crawlNewUrls: v })} />
      <CheckField label="Run URL Inspection on crawled pages" checked={options.urlInspection} onChange={(v) => set({ urlInspection: v })} />
      <NumberField label="Max URL Inspections" hint="Google allows 2,000 a day for each property" value={options.maxInspections} min={1} onChange={(v) => set({ maxInspections: v })} />
    </>
  )
}
