import type { FilterDefinition, TabDefinition } from '../../interfaces/filterDefinition'
import type { TabBundle } from './defineTab'
import { internalTab, externalTab } from './internalExternal'
import { securityTab } from './security'
import { responseCodesTab } from './responseCodes'
import { urlTab } from './url'
import { pageTitlesTab } from './pageTitles'
import { metaDescriptionTab } from './metaDescription'
import { metaKeywordsTab } from './metaKeywords'
import { h1Tab, h2Tab } from './headings'
import { contentTab } from './content'
import { imagesTab } from './images'
import { canonicalsTab } from './canonicals'
import { directivesTab } from './directives'
import { linksTab } from './links'
import { sitemapsTab } from './sitemaps'
import { paginationTab } from './pagination'
import { hreflangTab } from './hreflang'
import { structuredDataTab } from './structuredData'
import { validationTab } from './validation'
import { javascriptTab } from './javascript'
import { accessibilityTab } from './accessibility'
import { pageSpeedTab, aiTab } from './integrations'
import { searchConsoleTab, analyticsTab } from './google'
import { customSearchTab, customExtractionTab } from './custom'

const BUNDLES: TabBundle[] = [
  internalTab,
  externalTab,
  securityTab,
  responseCodesTab,
  urlTab,
  pageTitlesTab,
  metaDescriptionTab,
  metaKeywordsTab,
  h1Tab,
  h2Tab,
  contentTab,
  imagesTab,
  canonicalsTab,
  paginationTab,
  directivesTab,
  hreflangTab,
  javascriptTab,
  linksTab,
  structuredDataTab,
  sitemapsTab,
  pageSpeedTab,
  accessibilityTab,
  customSearchTab,
  customExtractionTab,
  analyticsTab,
  searchConsoleTab,
  validationTab,
  aiTab
]

export const TABS: TabDefinition[] = BUNDLES.map((b) => b.tab)

export const FILTERS: FilterDefinition[] = BUNDLES.flatMap((b) => b.filters)

export const FILTERS_BY_KEY: Record<string, FilterDefinition> = Object.fromEntries(FILTERS.map((f) => [f.key, f]))

export const TABS_BY_KEY: Record<string, TabDefinition> = Object.fromEntries(TABS.map((t) => [t.key, t]))

export const TAB_GROUPS: string[] = [...new Set(TABS.map((t) => t.group))]
