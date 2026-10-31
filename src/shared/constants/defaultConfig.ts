import type { CrawlConfig } from '../interfaces/crawlConfig'
import { APP_SLUG } from './appInfo'

export const DEFAULT_USER_AGENT = `Mozilla/5.0 (compatible; ${APP_SLUG}/0.1)`

export const DEFAULT_CONFIG: CrawlConfig = {
  mode: 'spider',
  startUrl: '',
  listUrls: [],
  userAgent: DEFAULT_USER_AGENT,
  responseTimeoutMs: 20000,
  respectRobotsTxt: true,
  includePatterns: [],
  excludePatterns: [],
  extraHeaders: {},
  limits: {
    maxUrls: 5000000,
    maxDepth: -1,
    maxUrlLength: 2000,
    maxRedirects: 5,
    maxPageSizeKb: 50 * 1024
  },
  speed: {
    maxThreads: 5,
    maxUrlsPerSecond: 0
  },
  resources: {
    checkImages: true,
    checkCss: true,
    checkJavaScript: true,
    checkMedia: true,
    checkExternalLinks: true,
    followInternalNofollow: false,
    followExternalNofollow: false,
    crawlCanonicals: true,
    crawlPagination: false,
    crawlHreflang: false,
    crawlAllSubdomains: false,
    crawlOutsideStartFolder: true
  },
  thresholds: {
    titleMaxChars: 60,
    titleMinChars: 30,
    titleMaxPixels: 561,
    titleMinPixels: 200,
    metaDescriptionMaxChars: 155,
    metaDescriptionMinChars: 70,
    metaDescriptionMaxPixels: 985,
    metaDescriptionMinPixels: 400,
    h1MaxChars: 70,
    h2MaxChars: 70,
    urlMaxChars: 115,
    imageMaxKb: 100,
    altTextMaxChars: 100,
    lowContentWords: 200,
    highCrawlDepth: 4,
    highInternalOutlinks: 1000,
    highExternalOutlinks: 100
  },
  sitemaps: {
    crawlLinkedSitemaps: true,
    sitemapUrls: []
  },
  content: {
    nearDuplicates: true,
    nearDuplicateThreshold: 90,
    storeHtml: true
  },
  rendering: {
    mode: 'text',
    timeoutMs: 5000,
    maxWindows: 2,
    accessibility: false,
    screenshots: false
  },
  integrations: {
    pagespeed: {
      enabled: false,
      apiKey: '',
      strategy: 'mobile',
      endpoint: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
      maxPages: 500
    },
    ai: {
      enabled: false,
      provider: 'anthropic',
      apiKey: '',
      model: 'claude-opus-5-5',
      baseUrl: '',
      maxPages: 100,
      maxInputChars: 20000,
      prompts: []
    },
    searchConsole: {
      enabled: false,
      siteUrl: '',
      dateRangeDays: 30,
      searchType: 'web',
      crawlNewUrls: false,
      urlInspection: false,
      maxInspections: 2000
    },
    analytics: {
      enabled: false,
      propertyId: '',
      dateRangeDays: 30,
      crawlNewUrls: false
    }
  },
  customSearches: [],
  customExtractions: []
}
