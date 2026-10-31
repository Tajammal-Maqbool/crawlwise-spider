import type { CrawlResourceOptions } from '@shared/interfaces/crawlConfig'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { CheckField } from '../common/CheckField'

const OPTIONS: Array<{ key: keyof CrawlResourceOptions; label: string }> = [
  { key: 'checkImages', label: 'Images' },
  { key: 'checkCss', label: 'CSS' },
  { key: 'checkJavaScript', label: 'JavaScript' },
  { key: 'checkMedia', label: 'Media and Fonts' },
  { key: 'checkExternalLinks', label: 'Check Links Outside of Start Folder and External Links' },
  { key: 'followInternalNofollow', label: 'Follow Internal "nofollow"' },
  { key: 'followExternalNofollow', label: 'Follow External "nofollow"' },
  { key: 'crawlCanonicals', label: 'Crawl Canonicals' },
  { key: 'crawlPagination', label: 'Crawl Pagination (rel next/prev)' },
  { key: 'crawlHreflang', label: 'Crawl Hreflang' },
  { key: 'crawlAllSubdomains', label: 'Crawl All Subdomains' },
  { key: 'crawlOutsideStartFolder', label: 'Crawl Outside of Start Folder' }
]

export function CrawlSection({ config, onChange }: ConfigSectionProps) {
  return (
    <div className="config-section">
      <h3>Resource Links and Crawl Behaviour</h3>
      {OPTIONS.map((o) => (
        <CheckField
          key={o.key}
          label={o.label}
          checked={config.resources[o.key]}
          onChange={(v) => onChange({ ...config, resources: { ...config.resources, [o.key]: v } })}
        />
      ))}
      <CheckField label="Respect robots.txt" checked={config.respectRobotsTxt} onChange={(v) => onChange({ ...config, respectRobotsTxt: v })} />
    </div>
  )
}
