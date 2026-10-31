import type { CrawlMode } from '../types/crawlState'
import type { CustomExtraction, CustomSearch } from './customRules'
import type { IntegrationOptions } from './integrations'

export interface CrawlLimits {
  maxUrls: number
  maxDepth: number
  maxUrlLength: number
  maxRedirects: number
  maxPageSizeKb: number
}

export interface CrawlSpeed {
  maxThreads: number
  maxUrlsPerSecond: number
}

export interface CrawlResourceOptions {
  checkImages: boolean
  checkCss: boolean
  checkJavaScript: boolean
  checkMedia: boolean
  checkExternalLinks: boolean
  followInternalNofollow: boolean
  followExternalNofollow: boolean
  crawlCanonicals: boolean
  crawlPagination: boolean
  crawlHreflang: boolean
  crawlAllSubdomains: boolean
  crawlOutsideStartFolder: boolean
}

export interface CrawlThresholds {
  titleMaxChars: number
  titleMinChars: number
  titleMaxPixels: number
  titleMinPixels: number
  metaDescriptionMaxChars: number
  metaDescriptionMinChars: number
  metaDescriptionMaxPixels: number
  metaDescriptionMinPixels: number
  h1MaxChars: number
  h2MaxChars: number
  urlMaxChars: number
  imageMaxKb: number
  altTextMaxChars: number
  lowContentWords: number
  highCrawlDepth: number
  highInternalOutlinks: number
  highExternalOutlinks: number
}

export interface SitemapOptions {
  crawlLinkedSitemaps: boolean
  sitemapUrls: string[]
}

export interface ContentOptions {
  nearDuplicates: boolean
  nearDuplicateThreshold: number
  storeHtml: boolean
}

export type RenderingMode = 'text' | 'javascript'

export interface RenderingOptions {
  mode: RenderingMode
  timeoutMs: number
  maxWindows: number
  accessibility: boolean
  screenshots: boolean
}

export interface CrawlConfig {
  mode: CrawlMode
  startUrl: string
  listUrls: string[]
  userAgent: string
  responseTimeoutMs: number
  respectRobotsTxt: boolean
  includePatterns: string[]
  excludePatterns: string[]
  extraHeaders: Record<string, string>
  limits: CrawlLimits
  speed: CrawlSpeed
  resources: CrawlResourceOptions
  thresholds: CrawlThresholds
  sitemaps: SitemapOptions
  content: ContentOptions
  rendering: RenderingOptions
  integrations: IntegrationOptions
  customSearches: CustomSearch[]
  customExtractions: CustomExtraction[]
}
