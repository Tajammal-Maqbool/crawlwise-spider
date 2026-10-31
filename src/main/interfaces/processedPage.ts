import type { SqlValue } from '../types/sqlValue'
import type { CustomValue } from './customValue'
import type { ExtractedLink } from './parsedPage'
import type { StructuredItem } from './structuredItem'
import type { AxeViolation } from './renderResult'

export interface HreflangRow {
  lang: string
  target: string
  source: 'HTML' | 'HTTP'
}

export interface ProcessedPage {
  fields: Record<string, SqlValue>
  headers: Array<[string, string]>
  html: string | null
  rawHtml: string | null
  screenshot: Uint8Array | null
  discovered: ExtractedLink[]
  hreflang: HreflangRow[]
  structured: StructuredItem[]
  custom: CustomValue[]
  sitemapEntries: string[]
  accessibility: AxeViolation[]
}
