import type { CrawlThresholds } from '@shared/interfaces/crawlConfig'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { NumberField } from '../common/NumberField'

const FIELDS: Array<{ key: keyof CrawlThresholds; label: string }> = [
  { key: 'titleMinChars', label: 'Page Title Min Characters' },
  { key: 'titleMaxChars', label: 'Page Title Max Characters' },
  { key: 'titleMinPixels', label: 'Page Title Min Pixel Width' },
  { key: 'titleMaxPixels', label: 'Page Title Max Pixel Width' },
  { key: 'metaDescriptionMinChars', label: 'Meta Description Min Characters' },
  { key: 'metaDescriptionMaxChars', label: 'Meta Description Max Characters' },
  { key: 'metaDescriptionMinPixels', label: 'Meta Description Min Pixel Width' },
  { key: 'metaDescriptionMaxPixels', label: 'Meta Description Max Pixel Width' },
  { key: 'h1MaxChars', label: 'H1 Max Characters' },
  { key: 'h2MaxChars', label: 'H2 Max Characters' },
  { key: 'urlMaxChars', label: 'URL Max Characters' },
  { key: 'imageMaxKb', label: 'Max Image Size (KB)' },
  { key: 'altTextMaxChars', label: 'Max Alt Text Characters' },
  { key: 'lowContentWords', label: 'Low Content Word Count' },
  { key: 'highCrawlDepth', label: 'High Crawl Depth' },
  { key: 'highInternalOutlinks', label: 'High Internal Outlinks' },
  { key: 'highExternalOutlinks', label: 'High External Outlinks' }
]

export function PreferencesSection({ config, onChange }: ConfigSectionProps) {
  return (
    <div className="config-section">
      <h3>Preferences</h3>
      {FIELDS.map((f) => (
        <NumberField
          key={f.key}
          label={f.label}
          value={config.thresholds[f.key]}
          onChange={(v) => onChange({ ...config, thresholds: { ...config.thresholds, [f.key]: v } })}
        />
      ))}
    </div>
  )
}
