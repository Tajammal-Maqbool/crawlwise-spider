import * as cheerio from 'cheerio'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { LinkType } from '@shared/types/linkType'
import { normalizeUrl } from '@shared/utils/normalizeUrl'
import type { FetchResult } from '../interfaces/fetchResult'
import type { ExtractedLink } from '../interfaces/parsedPage'
import type { HreflangRow, ProcessedPage } from '../interfaces/processedPage'
import type { SqlValue } from '../types/sqlValue'
import { parseHtml } from './htmlParser'
import { pageFields } from './pageFields'
import { headerValue, indexabilityOf, redirectTarget, resolveKind, responseFields } from './responseFields'
import { decodeBody } from './decodeBody'
import { extractStructuredData } from './structuredData'
import { structuredFields } from './structuredFields'
import { minhashSignature } from './minhash'
import { readability } from './readability'
import { validateSource } from './sourceValidation'
import { runCustomRules } from './customRunner'
import { looksLikeSitemap, parseSitemap } from './sitemapParser'
import { isValidHreflang } from './hreflangCode'
import { jsFields } from './jsFields'
import type { RenderResult } from '../interfaces/renderResult'

const SOFT_404 = /\b(404|not found|page not found|no longer (exists|available)|does ?n[o']t exist)\b/i

export function processPage(url: string, isInternal: boolean, result: FetchResult, config: CrawlConfig, rendered: RenderResult | null = null): ProcessedPage {
  const kind = resolveKind(url, result)
  const fields: Record<string, SqlValue> = { ...responseFields(url, result, kind), state: 3 }
  const out: ProcessedPage = { fields, headers: result.headers, html: null, rawHtml: null, screenshot: null, discovered: [], hreflang: [], structured: [], custom: [], sitemapEntries: [], accessibility: [] }

  const redirect = redirectTarget(url, result)
  if (redirect) {
    fields.redirect_url = redirect.target
    fields.redirect_type = redirect.type
    out.discovered.push(syntheticLink(redirect.target, 'HTTP Redirect'))
  }

  const is2xx = result.statusCode >= 200 && result.statusCode < 300
  if (isInternal && is2xx && result.body) {
    if (kind === 'html') analyseHtml(url, result, config, out, rendered)
    else if (looksLikeSitemap(result.body)) analyseSitemap(url, result.body, out)
  }

  out.hreflang.push(...linkHeaderHreflang(headerValue(result, 'link'), url))
  fields.hreflang_invalid_codes = out.hreflang.filter((h) => !isValidHreflang(h.lang)).length
  const httpCanonical = fields.http_canonical as string | null
  if (httpCanonical) out.discovered.push(syntheticLink(httpCanonical, 'HTTP Canonical'))

  const [indexability, status] = indexabilityOf({
    statusCode: result.statusCode,
    blocked: false,
    tooLarge: result.tooLarge,
    robotsText: `${fields.meta_robots ?? ''},${fields.x_robots_tag ?? ''}`,
    canonical: (fields.canonical as string | null) ?? httpCanonical,
    url,
    redirected: fields.redirect_type === 'Meta Refresh' || fields.redirect_type === 'HTTP Refresh'
  })
  fields.indexability = indexability
  fields.indexability_status = status
  return out
}

function analyseHtml(url: string, result: FetchResult, config: CrawlConfig, out: ProcessedPage, rendered: RenderResult | null): void {
  const body = result.body as Buffer
  const rawHtml = decodeBody(body, result.contentType)
  const html = rendered ? rendered.html : rawHtml
  const $ = cheerio.load(html)
  const page = parseHtml(html, url, $)
  const fields = out.fields
  Object.assign(fields, pageFields(page, url, body))
  if (rendered) Object.assign(fields, jsFields(parseHtml(rawHtml, url), page, rendered))
  if (rendered?.accessibility) {
    out.accessibility = rendered.accessibility
    fields.a11y_checked = 1
    fields.a11y_violations = rendered.accessibility.length
  }
  if (page.metaRefreshUrl && !fields.redirect_type && page.metaRefreshUrl !== url) {
    fields.redirect_url = page.metaRefreshUrl
    fields.redirect_type = 'Meta Refresh'
  }

  const sd = extractStructuredData($)
  Object.assign(fields, structuredFields(sd))
  const read = readability(page.text)
  const source = validateSource(html)
  const signature = config.content.nearDuplicates ? minhashSignature(page.text) : null
  Object.assign(fields, {
    hreflang_count: page.hreflang.length,
    hreflang_outside_head: page.hreflangOutsideHead ? 1 : 0,
    rel_next_count: page.relNextCount,
    rel_prev_count: page.relPrevCount,
    sentence_count: read.sentences,
    flesch_score: read.fleschScore,
    soft_404: SOFT_404.test(`${page.title ?? ''} ${page.h1[0] ?? ''}`) ? 1 : 0,
    minhash: signature ? new Uint8Array(signature.buffer) : null,
    head_count: source.headCount,
    body_count: source.bodyCount,
    head_not_first: source.headNotFirst ? 1 : 0,
    invalid_head_elements: source.invalidHeadElements ? 1 : 0,
    body_before_html: source.bodyBeforeHtml ? 1 : 0
  })

  out.html = config.content.storeHtml ? html : null
  out.rawHtml = config.content.storeHtml && rendered ? rawHtml : null
  out.screenshot = rendered?.screenshot ?? null
  out.discovered.push(...page.links)
  out.hreflang.push(...page.hreflang.map((h): HreflangRow => ({ lang: h.lang, target: h.url, source: 'HTML' })))
  out.structured = sd.items
  out.custom = runCustomRules($, html, page.text, config.customSearches, config.customExtractions)
}

function analyseSitemap(url: string, body: Buffer, out: ProcessedPage): void {
  const sitemap = parseSitemap(body, url)
  if (!sitemap) return
  out.fields.is_sitemap = 1
  out.fields.sitemap_url_count = sitemap.urls.length
  out.discovered.push(...sitemap.urls.map((u) => syntheticLink(u, 'XML Sitemap')))
  if (!sitemap.isIndex) out.sitemapEntries = sitemap.urls
}

function linkHeaderHreflang(link: string | null, base: string): HreflangRow[] {
  if (!link) return []
  const rows: HreflangRow[] = []
  for (const part of link.split(/,(?=\s*<)/)) {
    const href = /<([^>]+)>/.exec(part)?.[1]
    const lang = /hreflang\s*=\s*"?([^";]+)"?/i.exec(part)?.[1]
    const target = href ? normalizeUrl(href, base) : null
    if (target && lang && /rel\s*=\s*"?alternate/i.test(part)) rows.push({ lang: lang.trim(), target, source: 'HTTP' })
  }
  return rows
}

export function syntheticLink(url: string, type: LinkType): ExtractedLink {
  return { url, rawHref: url, type, anchor: null, alt: null, rel: null, follow: true, target: null, position: 'Head', pathType: 'Absolute', hasDimensions: null }
}
