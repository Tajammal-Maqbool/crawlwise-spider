import { gunzipSync } from 'node:zlib'
import { normalizeUrl } from '@shared/utils/normalizeUrl'
import { MAX_SITEMAP_DECOMPRESSED_BYTES } from '../constants/sitemap'

export interface ParsedSitemap {
  isIndex: boolean
  urls: string[]
}

export function looksLikeSitemap(body: Buffer): boolean {
  const head = body.subarray(0, 2048).toString('utf8')
  return /<(urlset|sitemapindex)[\s>]/i.test(head) || isGzip(body)
}

export function parseSitemap(body: Buffer, sitemapUrl: string, maxOutputLength = MAX_SITEMAP_DECOMPRESSED_BYTES): ParsedSitemap | null {
  const raw = isGzip(body) ? safeGunzip(body, maxOutputLength) : body
  if (!raw) return null
  const xml = raw.toString('utf8')
  const isIndex = /<sitemapindex[\s>]/i.test(xml)
  if (!isIndex && !/<urlset[\s>]/i.test(xml)) return null
  const urls = [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/gi)]
    .map((m) => normalizeUrl(decodeEntities(m[1]), sitemapUrl))
    .filter((u): u is string => !!u)
  return { isIndex, urls: [...new Set(urls)] }
}

function isGzip(body: Buffer): boolean {
  return body.length > 2 && body[0] === 0x1f && body[1] === 0x8b
}

function safeGunzip(body: Buffer, maxOutputLength: number): Buffer | null {
  try {
    return gunzipSync(body, { maxOutputLength })
  } catch {
    return null
  }
}

function decodeEntities(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim()
}
