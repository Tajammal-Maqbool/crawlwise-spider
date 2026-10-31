import * as cheerio from 'cheerio'
import type { Cheerio, CheerioAPI } from 'cheerio'
import type { AnyNode, Element } from 'domhandler'
import type { LinkType } from '@shared/types/linkType'
import { normalizeUrl } from '@shared/utils/normalizeUrl'
import { pathTypeOf } from '@shared/utils/pathType'
import type { CanonicalInfo, ExtractedLink, HreflangEntry, ParsedPage } from '../interfaces/parsedPage'

const TEXT_EXCLUDED = 'script, style, noscript, template, svg'
const SKIPPED_SCHEMES = /^(javascript|mailto|tel|data|ftp|file|sms):/i
const CANONICAL_ALLOWED_ATTRS = new Set(['rel', 'href'])

export function parseHtml(html: string, pageUrl: string, $: CheerioAPI = cheerio.load(html)): ParsedPage {
  const baseHref = $('base[href]').first().attr('href')
  const base = (baseHref && normalizeUrl(baseHref, pageUrl)) || pageUrl

  const titles = $('title')
  const descriptions = $('meta[name]').filter((_, el) => lowerAttr(el, 'name') === 'description')
  const keywords = $('meta[name]').filter((_, el) => lowerAttr(el, 'name') === 'keywords')
  const robots = $('meta[name]').filter((_, el) => ['robots', 'googlebot'].includes(lowerAttr(el, 'name')))
  const refresh = $('meta[http-equiv]').filter((_, el) => lowerAttr(el, 'http-equiv') === 'refresh').first()
  const headings = $('h1, h2, h3, h4, h5, h6').toArray()
  const h1s = $('h1')
  const h2s = $('h2')

  const refreshContent = refresh.attr('content') ?? null
  const refreshTarget = refreshContent ? parseRefreshUrl(refreshContent, base) : null

  const bodyText = textOf($, $('body').length ? $('body') : $.root())
  const words = bodyText.split(/\s+/).filter(Boolean)

  return {
    title: titles.length ? clean(titles.first().text()) : null,
    titleCount: titles.length,
    titleOutsideHead: anyOutsideHead($, titles),
    metaDescription: descriptions.length ? clean(descriptions.first().attr('content') ?? '') : null,
    metaDescriptionCount: descriptions.length,
    metaDescriptionOutsideHead: anyOutsideHead($, descriptions),
    metaKeywords: keywords.length ? clean(keywords.first().attr('content') ?? '') : null,
    metaKeywordsCount: keywords.length,
    h1: h1s.toArray().map((el) => headingText($, el)),
    h1AltText: h1s.toArray().some((el) => clean($(el).text()) === '' && $(el).find('img[alt]').length > 0),
    h1NonSequential: headings.length > 0 && headings[0].tagName.toLowerCase() !== 'h1',
    h2: h2s.toArray().map((el) => headingText($, el)),
    h2NonSequential: h2BeforeH1(headings),
    canonical: readCanonical($, base),
    metaRobots: robots.length ? robots.toArray().map((el) => clean($(el).attr('content') ?? '')).join(', ') : null,
    metaRobotsOutsideHead: anyOutsideHead($, robots),
    metaRefresh: refreshContent,
    metaRefreshUrl: refreshTarget,
    relNext: linkRel($, 'next', base),
    relPrev: linkRel($, 'prev', base),
    htmlLang: $('html').attr('lang') ?? null,
    wordCount: words.length,
    textRatio: html.length ? Math.round((bodyText.length / html.length) * 10000) / 100 : 0,
    loremIpsum: /lorem ipsum/i.test(bodyText),
    hasForm: $('form').length > 0,
    formActions: $('form[action]').toArray().map((el) => normalizeUrl($(el).attr('action') ?? '', base)).filter((u): u is string => !!u),
    links: extractLinks($, base, refreshTarget),
    hreflang: readHreflang($, base),
    hreflangOutsideHead: anyOutsideHead($, hreflangLinks($)),
    relNextCount: relLinks($, 'next').length,
    relPrevCount: relLinks($, 'prev').length,
    text: bodyText
  }
}

function hreflangLinks($: CheerioAPI): Cheerio<Element> {
  return $('link[hreflang][href]').filter((_, el) => lowerAttr(el, 'rel').split(/\s+/).includes('alternate'))
}

function readHreflang($: CheerioAPI, base: string): HreflangEntry[] {
  return hreflangLinks($)
    .toArray()
    .map((el) => ({ lang: ($(el).attr('hreflang') ?? '').trim(), url: normalizeUrl($(el).attr('href') ?? '', base) }))
    .filter((h): h is HreflangEntry => !!h.url && h.lang.length > 0)
}

function relLinks($: CheerioAPI, rel: string): Cheerio<Element> {
  return $('link[rel]').filter((_, e) => lowerAttr(e, 'rel').split(/\s+/).includes(rel))
}

function extractLinks($: CheerioAPI, base: string, refreshTarget: string | null): ExtractedLink[] {
  const links: ExtractedLink[] = []
  const add = (el: Element, raw: string | undefined, type: LinkType, extra: Partial<ExtractedLink> = {}) => {
    if (!raw || SKIPPED_SCHEMES.test(raw.trim()) || raw.trim().startsWith('#')) return
    const url = normalizeUrl(raw, base)
    if (!url) return
    const rel = $(el).attr('rel') ?? null
    links.push({
      url,
      rawHref: raw,
      type,
      anchor: null,
      alt: null,
      rel,
      follow: !(rel && /\bnofollow\b/i.test(rel)),
      target: $(el).attr('target') ?? null,
      position: positionOf($, el),
      pathType: pathTypeOf(raw),
      hasDimensions: null,
      ...extra
    })
  }

  $('a[href], area[href]').each((_, el) => {
    const img = $(el).find('img[alt]').first()
    add(el, $(el).attr('href'), 'Hyperlink', {
      anchor: clean($(el).text()),
      alt: img.length ? (img.attr('alt') ?? null) : null
    })
  })
  $('img[src]').each((_, el) => {
    add(el, $(el).attr('src'), 'Image', {
      alt: $(el).attr('alt') ?? null,
      hasDimensions: $(el).attr('width') !== undefined && $(el).attr('height') !== undefined
    })
  })
  $('link[href]').each((_, el) => {
    const rel = (($(el).attr('rel') ?? '') as string).toLowerCase().split(/\s+/)
    const href = $(el).attr('href')
    if (rel.includes('stylesheet')) add(el, href, 'CSS')
    else if (rel.includes('canonical')) add(el, href, 'Canonical')
    else if (rel.includes('next')) add(el, href, 'Rel Next')
    else if (rel.includes('prev')) add(el, href, 'Rel Prev')
    else if (rel.includes('alternate') && $(el).attr('hreflang')) add(el, href, 'Hreflang')
    else if (rel.includes('amphtml')) add(el, href, 'AMPHTML')
    else if (rel.includes('alternate') && $(el).attr('media')) add(el, href, 'Mobile Alternate')
    else if (rel.includes('icon') || rel.includes('apple-touch-icon')) add(el, href, 'Image')
    else if (rel.includes('preload') && $(el).attr('as') === 'font') add(el, href, 'Font')
  })
  $('script[src]').each((_, el) => add(el, $(el).attr('src'), 'JavaScript'))
  $('iframe[src]').each((_, el) => add(el, $(el).attr('src'), 'Iframe'))
  $('video[src], audio[src], source[src]').each((_, el) => add(el, $(el).attr('src'), 'Media'))
  if (refreshTarget) {
    const el = $('meta[http-equiv]').filter((_, m) => lowerAttr(m, 'http-equiv') === 'refresh').first().get(0)
    if (el) add(el, refreshTarget, 'Meta Refresh')
  }
  return links
}

function readCanonical($: CheerioAPI, base: string): CanonicalInfo {
  const els = $('link[rel]').filter((_, el) => lowerAttr(el, 'rel').split(/\s+/).includes('canonical'))
  const hrefs = els.toArray().map((el) => $(el).attr('href') ?? '')
  const resolved = hrefs.map((h) => normalizeUrl(h, base)).filter((u): u is string => !!u)
  const first = els.first()
  const firstHref = hrefs[0] ?? ''
  return {
    url: resolved[0] ?? null,
    count: els.length,
    relative: els.length > 0 && pathTypeOf(firstHref) !== 'Absolute',
    fragment: hrefs.some((h) => h.includes('#')),
    outsideHead: anyOutsideHead($, els),
    invalidAttribute: first.length > 0 && Object.keys(first.attr() ?? {}).some((a) => !CANONICAL_ALLOWED_ATTRS.has(a.toLowerCase())),
    conflicting: new Set(resolved).size > 1
  }
}

function linkRel($: CheerioAPI, rel: string, base: string): string | null {
  const el = $('link[rel]').filter((_, e) => lowerAttr(e, 'rel').split(/\s+/).includes(rel)).first()
  const href = el.attr('href')
  return href ? normalizeUrl(href, base) : null
}

function parseRefreshUrl(content: string, base: string): string | null {
  const match = /url\s*=\s*['"]?([^'";]+)/i.exec(content)
  return match ? normalizeUrl(match[1], base) : null
}

function positionOf($: CheerioAPI, el: Element): string {
  const ancestors = $(el).parents().toArray().map((p) => p.tagName.toLowerCase())
  if (ancestors.includes('nav')) return 'Navigation'
  if (ancestors.includes('header')) return 'Header'
  if (ancestors.includes('footer')) return 'Footer'
  if (ancestors.includes('aside')) return 'Aside'
  if (ancestors.includes('head')) return 'Head'
  return 'Content'
}

function anyOutsideHead($: CheerioAPI, els: Cheerio<Element>): boolean {
  return els.toArray().some((el) => $(el).closest('head').length === 0)
}

function h2BeforeH1(headings: Element[]): boolean {
  const firstH2 = headings.findIndex((h) => h.tagName.toLowerCase() === 'h2')
  if (firstH2 < 0) return false
  const firstH1 = headings.findIndex((h) => h.tagName.toLowerCase() === 'h1')
  return firstH1 < 0 || firstH2 < firstH1
}

function headingText($: CheerioAPI, el: Element): string {
  const text = clean($(el).text())
  return text || clean($(el).find('img[alt]').first().attr('alt') ?? '')
}

function textOf($: CheerioAPI, root: Cheerio<AnyNode>): string {
  const copy = root.clone()
  copy.find(TEXT_EXCLUDED).remove()
  return clean(copy.text())
}

function lowerAttr(el: Element, name: string): string {
  return (el.attribs?.[name] ?? '').toLowerCase().trim()
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}
