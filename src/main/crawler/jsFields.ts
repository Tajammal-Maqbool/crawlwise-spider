import type { ParsedPage } from '../interfaces/parsedPage'
import type { RenderResult } from '../interfaces/renderResult'
import type { SqlValue } from '../types/sqlValue'

const MAX_MESSAGES = 20

export function jsFields(raw: ParsedPage, rendered: ParsedPage, result: RenderResult): Record<string, SqlValue> {
  const rawLinks = new Set(raw.links.filter((l) => l.type === 'Hyperlink').map((l) => l.url))
  const jsLinks = new Set(rendered.links.filter((l) => l.type === 'Hyperlink' && !rawLinks.has(l.url)).map((l) => l.url))
  const messages = [...result.errors.map((m) => `Error: ${m}`), ...result.warnings.map((m) => `Warning: ${m}`)].slice(0, MAX_MESSAGES)
  return {
    rendered: 1,
    raw_title: raw.title,
    raw_meta_description: raw.metaDescription,
    raw_h1: raw.h1[0] ?? null,
    raw_canonical: raw.canonical.url,
    raw_meta_robots: raw.metaRobots,
    raw_word_count: raw.wordCount,
    js_link_count: jsLinks.size,
    js_errors: result.errors.length,
    js_warnings: result.warnings.length,
    js_messages: messages.length ? messages.join('\n') : null,
    blocked_resources: result.failedResources.length
  }
}
