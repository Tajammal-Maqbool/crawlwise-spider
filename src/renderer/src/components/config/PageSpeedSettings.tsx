import type { PageSpeedOptions, PageSpeedStrategy } from '@shared/interfaces/integrations'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { PSI_STRATEGY_OPTIONS } from '../../constants/integrationOptions'
import { CheckField } from '../common/CheckField'
import { NumberField } from '../common/NumberField'
import { PasswordField } from '../common/PasswordField'
import { SelectField } from '../common/SelectField'

export function PageSpeedSettings({ config, onChange }: ConfigSectionProps) {
  const pagespeed = config.integrations.pagespeed
  const set = (patch: Partial<PageSpeedOptions>) => onChange({ ...config, integrations: { ...config.integrations, pagespeed: { ...pagespeed, ...patch } } })

  return (
    <>
      <h3>PageSpeed Insights</h3>
      <CheckField label="Run PageSpeed Insights after the crawl" checked={pagespeed.enabled} onChange={(v) => set({ enabled: v })} />
      <PasswordField label="API Key" value={pagespeed.apiKey} placeholder="Google Cloud API key" onChange={(v) => set({ apiKey: v })} />
      <SelectField<PageSpeedStrategy> label="Device" value={pagespeed.strategy} options={PSI_STRATEGY_OPTIONS} onChange={(v) => set({ strategy: v })} />
      <NumberField label="Max Pages" value={pagespeed.maxPages} min={1} onChange={(v) => set({ maxPages: v })} />
    </>
  )
}
