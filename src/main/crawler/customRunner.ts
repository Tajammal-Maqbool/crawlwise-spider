import type { CheerioAPI } from 'cheerio'
import type { CustomExtraction, CustomSearch } from '@shared/interfaces/customRules'
import type { CustomValue } from '../interfaces/customValue'


export function runCustomRules($: CheerioAPI, html: string, text: string, searches: CustomSearch[], extractions: CustomExtraction[]): CustomValue[] {
  const values: CustomValue[] = []
  searches.forEach((s, slot) => {
    const count = countMatches(s.scope === 'text' ? text : html, s)
    if (count === null) return
    const hit = s.mode === 'contains' ? count > 0 : count === 0
    if (hit) values.push({ kind: 'search', slot, value: String(count) })
  })
  extractions.forEach((x, slot) => {
    for (const value of extract($, html, x)) values.push({ kind: 'extraction', slot, value })
  })
  return values
}

function countMatches(haystack: string, s: CustomSearch): number | null {
  if (!s.pattern) return null
  try {
    const re = s.regex ? new RegExp(s.pattern, 'gi') : new RegExp(escapeRegex(s.pattern), 'gi')
    return (haystack.match(re) ?? []).length
  } catch {
    return null
  }
}

function extract($: CheerioAPI, html: string, x: CustomExtraction): string[] {
  if (!x.selector) return []
  try {
    if (x.type === 'regex') {
      return [...html.matchAll(new RegExp(x.selector, 'gi'))].map((m) => (m[1] ?? m[0]).trim()).slice(0, 50)
    }
    return $(x.selector)
      .toArray()
      .slice(0, 50)
      .map((el) => (x.output === 'html' ? ($(el).html() ?? '') : x.output === 'attribute' ? ($(el).attr(x.attribute) ?? '') : $(el).text().replace(/\s+/g, ' ').trim()))
      .filter(Boolean)
  } catch {
    return []
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
