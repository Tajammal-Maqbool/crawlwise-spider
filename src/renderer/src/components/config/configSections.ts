import type { ComponentType } from 'react'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { CrawlSection } from './CrawlSection'
import { LimitsSection } from './LimitsSection'
import { SpeedSection } from './SpeedSection'
import { RequestSection } from './RequestSection'
import { IncludeExcludeSection } from './IncludeExcludeSection'
import { PreferencesSection } from './PreferencesSection'
import { SitemapsSection } from './SitemapsSection'
import { RenderingSection } from './RenderingSection'
import { ContentSection } from './ContentSection'
import { CustomSearchSection } from './CustomSearchSection'
import { CustomExtractionSection } from './CustomExtractionSection'
import { ApiAccessSection } from './ApiAccessSection'

export const CONFIG_SECTIONS: Array<{ key: string; label: string; component: ComponentType<ConfigSectionProps> }> = [
  { key: 'crawl', label: 'Spider: Crawl', component: CrawlSection },
  { key: 'limits', label: 'Spider: Limits', component: LimitsSection },
  { key: 'preferences', label: 'Spider: Preferences', component: PreferencesSection },
  { key: 'rendering', label: 'Spider: Rendering', component: RenderingSection },
  { key: 'sitemaps', label: 'Spider: XML Sitemaps', component: SitemapsSection },
  { key: 'content', label: 'Content', component: ContentSection },
  { key: 'include', label: 'Include / Exclude', component: IncludeExcludeSection },
  { key: 'speed', label: 'Speed', component: SpeedSection },
  { key: 'request', label: 'User-Agent and Headers', component: RequestSection },
  { key: 'custom-search', label: 'Custom Search', component: CustomSearchSection },
  { key: 'custom-extraction', label: 'Custom Extraction', component: CustomExtractionSection },
  { key: 'api', label: 'API Access', component: ApiAccessSection }
]
