import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { CheckField } from '../common/CheckField'
import { LinesField } from '../common/LinesField'

export function SitemapsSection({ config, onChange }: ConfigSectionProps) {
  const set = (patch: Partial<typeof config.sitemaps>) => onChange({ ...config, sitemaps: { ...config.sitemaps, ...patch } })
  return (
    <div className="config-section">
      <h3>XML Sitemaps</h3>
      <CheckField label="Crawl Linked XML Sitemaps (from robots.txt)" checked={config.sitemaps.crawlLinkedSitemaps} onChange={(v) => set({ crawlLinkedSitemaps: v })} />
      <LinesField label="XML Sitemap URLs" hint="One per line. They are crawled with the site." value={config.sitemaps.sitemapUrls} onChange={(v) => set({ sitemapUrls: v })} />
    </div>
  )
}
