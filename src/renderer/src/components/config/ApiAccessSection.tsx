import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { useGoogleAccount } from '../../hooks/useGoogleAccount'
import { GoogleAccountSettings } from './GoogleAccountSettings'
import { SearchConsoleSettings } from './SearchConsoleSettings'
import { AnalyticsSettings } from './AnalyticsSettings'
import { PageSpeedSettings } from './PageSpeedSettings'
import { AiSettings } from './AiSettings'

export function ApiAccessSection({ config, onChange }: ConfigSectionProps) {
  const google = useGoogleAccount()

  return (
    <div className="config-section">
      <GoogleAccountSettings google={google} />
      <SearchConsoleSettings config={config} onChange={onChange} google={google} />
      <AnalyticsSettings config={config} onChange={onChange} google={google} />
      <PageSpeedSettings config={config} onChange={onChange} />
      <AiSettings config={config} onChange={onChange} />
      <p className="hint">
        API keys and the Google sign-in stay on this computer. They are not saved in crawl files or scheduled tasks. AI prompts send page text to the provider, and the provider bills you for them.
      </p>
    </div>
  )
}
