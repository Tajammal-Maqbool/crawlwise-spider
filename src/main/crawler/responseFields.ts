import { STATUS_CODES } from 'node:http'
import { kindFromContentType, kindFromExtension } from '@shared/utils/urlKind'
import { normalizeUrl } from '@shared/utils/normalizeUrl'
import type { UrlKind } from '@shared/types/urlKind'
import type { FetchResult } from '../interfaces/fetchResult'
import type { SqlValue } from '../types/sqlValue'

const PAGE_LIKE_EXTENSIONS: ReadonlyArray<UrlKind> = ['html']

export function headerValue(result: FetchResult, name: string): string | null {
  const found = result.headers.find(([n]) => n.toLowerCase() === name)
  return found ? found[1] : null
}

export function resolveKind(url: string, result: FetchResult): UrlKind {
  if (result.contentType) return kindFromContentType(result.contentType)
  return kindFromExtension(url) ?? 'unknown'
}

export function responseFields(url: string, result: FetchResult, kind: UrlKind): Record<string, SqlValue> {
  const extKind = kindFromExtension(url)
  const statusText = result.statusCode === 0 ? result.statusText : result.statusText || STATUS_CODES[result.statusCode] || ''
  return {
    status_code: result.statusCode,
    status_text: result.tooLarge ? 'Max Page Size Exceeded' : statusText,
    content_type: result.contentType,
    kind,
    size: result.size,
    transferred: result.transferred,
    response_time_ms: result.responseTimeMs,
    last_modified: headerValue(result, 'last-modified'),
    crawl_timestamp: new Date().toISOString(),
    http_version: result.statusCode > 0 ? '1.1' : null,
    error: result.error,
    x_robots_tag: headerValue(result, 'x-robots-tag'),
    http_canonical: linkHeaderCanonical(headerValue(result, 'link'), url),
    hsts: flag(headerValue(result, 'strict-transport-security') !== null),
    csp: flag(headerValue(result, 'content-security-policy') !== null),
    x_content_type_options: flag((headerValue(result, 'x-content-type-options') ?? '').toLowerCase().includes('nosniff')),
    x_frame_options: flag(headerValue(result, 'x-frame-options') !== null || /frame-ancestors/i.test(headerValue(result, 'content-security-policy') ?? '')),
    referrer_policy: headerValue(result, 'referrer-policy'),
    bad_content_type: flag(result.statusCode >= 200 && result.statusCode < 300 && extKind !== null && !PAGE_LIKE_EXTENSIONS.includes(extKind) && extKind !== kind)
  }
}

export function redirectTarget(url: string, result: FetchResult): { target: string; type: string } | null {
  if (result.statusCode >= 300 && result.statusCode < 400) {
    const location = headerValue(result, 'location')
    const target = location ? normalizeUrl(location, url) : null
    return target ? { target, type: 'HTTP Redirect' } : null
  }
  const refresh = headerValue(result, 'refresh')
  if (refresh) {
    const match = /url\s*=\s*['"]?([^'";]+)/i.exec(refresh)
    const target = match ? normalizeUrl(match[1], url) : null
    if (target) return { target, type: 'HTTP Refresh' }
  }
  return null
}

export function indexabilityOf(input: {
  statusCode: number
  blocked: boolean
  tooLarge: boolean
  robotsText: string
  canonical: string | null
  url: string
  redirected: boolean
}): [string, string] {
  if (input.blocked) return ['Non-Indexable', 'Blocked by robots.txt']
  if (input.tooLarge) return ['Non-Indexable', 'Max Page Size Exceeded']
  if (input.statusCode === 0) return ['Non-Indexable', 'No Response']
  if (input.statusCode >= 300 && input.statusCode < 400) return ['Non-Indexable', 'Redirected']
  if (input.statusCode >= 400 && input.statusCode < 500) return ['Non-Indexable', 'Client Error']
  if (input.statusCode >= 500) return ['Non-Indexable', 'Server Error']
  if (input.redirected) return ['Non-Indexable', 'Redirected']
  const robots = input.robotsText.toLowerCase()
  if (/\bnoindex\b|\bnone\b/.test(robots)) return ['Non-Indexable', 'noindex']
  if (input.canonical && input.canonical !== input.url) return ['Non-Indexable', 'Canonicalised']
  return ['Indexable', '']
}

function linkHeaderCanonical(link: string | null, base: string): string | null {
  if (!link) return null
  for (const part of link.split(',')) {
    const match = /<([^>]+)>\s*;.*rel\s*=\s*"?canonical"?/i.exec(part)
    if (match) return normalizeUrl(match[1], base)
  }
  return null
}

function flag(value: boolean): number {
  return value ? 1 : 0
}
