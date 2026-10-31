import { createHash } from 'node:crypto'
import { pixelWidth } from '@shared/utils/pixelWidth'
import { SERP_DESCRIPTION_FONT_PX, SERP_TITLE_FONT_PX } from '@shared/constants/arialWidths'
import type { ParsedPage } from '../interfaces/parsedPage'
import type { SqlValue } from '../types/sqlValue'

const RESOURCE_TYPES = new Set(['Image', 'CSS', 'JavaScript', 'Iframe', 'Media', 'Font'])

export function pageFields(page: ParsedPage, pageUrl: string, body: Buffer): Record<string, SqlValue> {
  const isHttps = pageUrl.startsWith('https:')
  const pageHost = new URL(pageUrl).hostname
  const resources = page.links.filter((l) => RESOURCE_TYPES.has(l.type))
  return {
    title: page.title,
    title_len: page.title?.length ?? null,
    title_px: page.title ? pixelWidth(page.title, SERP_TITLE_FONT_PX) : null,
    title_count: page.titleCount,
    title_outside_head: flag(page.titleOutsideHead),
    meta_description: page.metaDescription,
    meta_description_len: page.metaDescription?.length ?? null,
    meta_description_px: page.metaDescription ? pixelWidth(page.metaDescription, SERP_DESCRIPTION_FONT_PX) : null,
    meta_description_count: page.metaDescriptionCount,
    meta_description_outside_head: flag(page.metaDescriptionOutsideHead),
    meta_keywords: page.metaKeywords,
    meta_keywords_len: page.metaKeywords?.length ?? null,
    meta_keywords_count: page.metaKeywordsCount,
    h1_1: page.h1[0] ?? null,
    h1_1_len: page.h1[0]?.length ?? null,
    h1_2: page.h1[1] ?? null,
    h1_2_len: page.h1[1]?.length ?? null,
    h1_count: page.h1.length,
    h1_alt_text: flag(page.h1AltText),
    h1_non_sequential: flag(page.h1NonSequential),
    h2_1: page.h2[0] ?? null,
    h2_1_len: page.h2[0]?.length ?? null,
    h2_2: page.h2[1] ?? null,
    h2_2_len: page.h2[1]?.length ?? null,
    h2_count: page.h2.length,
    h2_non_sequential: flag(page.h2NonSequential),
    canonical: page.canonical.url,
    canonical_count: page.canonical.count,
    canonical_relative: flag(page.canonical.relative),
    canonical_fragment: flag(page.canonical.fragment),
    canonical_outside_head: flag(page.canonical.outsideHead),
    canonical_invalid_attribute: flag(page.canonical.invalidAttribute),
    canonical_conflicting: flag(page.canonical.conflicting),
    meta_robots: page.metaRobots,
    meta_robots_outside_head: flag(page.metaRobotsOutsideHead),
    meta_refresh: page.metaRefresh,
    rel_next: page.relNext,
    rel_prev: page.relPrev,
    html_lang: page.htmlLang,
    word_count: page.wordCount,
    text_ratio: page.textRatio,
    hash: createHash('md5').update(body).digest('hex'),
    lorem_ipsum: flag(page.loremIpsum),
    mixed_content: flag(isHttps && resources.some((l) => l.url.startsWith('http:'))),
    insecure_form_action: flag(isHttps && page.formActions.some((a) => a.startsWith('http:'))),
    form_on_http: flag(!isHttps && page.hasForm),
    unsafe_cross_origin: flag(
      page.links.some(
        (l) =>
          l.type === 'Hyperlink' &&
          (l.target ?? '').toLowerCase() === '_blank' &&
          new URL(l.url).hostname !== pageHost &&
          !/\bnoopener\b|\bnoreferrer\b/i.test(l.rel ?? '')
      )
    ),
    protocol_relative_links: flag(resources.some((l) => l.pathType === 'Protocol-Relative'))
  }
}

function flag(value: boolean): number {
  return value ? 1 : 0
}
