export type PageSpeedStrategy = 'mobile' | 'desktop'

export interface PageSpeedOptions {
  enabled: boolean
  apiKey: string
  strategy: PageSpeedStrategy
  endpoint: string
  maxPages: number
}

export type AiProvider = 'anthropic' | 'ollama'

export interface AiPrompt {
  name: string
  prompt: string
}

export interface AiOptions {
  enabled: boolean
  provider: AiProvider
  apiKey: string
  model: string
  baseUrl: string
  maxPages: number
  maxInputChars: number
  prompts: AiPrompt[]
}


export type SearchType = 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews'

export interface SearchConsoleOptions {
  enabled: boolean
  siteUrl: string
  dateRangeDays: number
  searchType: SearchType
  crawlNewUrls: boolean
  urlInspection: boolean
  maxInspections: number
}

export interface AnalyticsOptions {
  enabled: boolean
  propertyId: string
  dateRangeDays: number
  crawlNewUrls: boolean
}

export interface IntegrationOptions {
  pagespeed: PageSpeedOptions
  ai: AiOptions
  searchConsole: SearchConsoleOptions
  analytics: AnalyticsOptions
}
