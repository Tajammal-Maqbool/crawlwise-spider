const INTERNAL_SEARCH_PARAMS = ['s', 'q', 'search', 'query', 'keyword', 'keywords']
const GA_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', '_ga', 'gclid']

export interface UrlFlags {
  urlLen: number
  nonAscii: boolean
  underscores: boolean
  uppercase: boolean
  parameters: boolean
  multipleSlashes: boolean
  repetitivePath: boolean
  containsSpace: boolean
  internalSearch: boolean
  gaParameters: boolean
  folderDepth: number
}

export function computeUrlFlags(url: string): UrlFlags {
  const parsed = new URL(url)
  const path = parsed.pathname
  const decodedPath = safeDecode(path)
  const segments = path.split('/').filter(Boolean)
  const params = [...parsed.searchParams.keys()].map((k) => k.toLowerCase())
  return {
    urlLen: url.length,
    nonAscii: /[^\x00-\x7F]/.test(decodedPath) || /%[89A-F][0-9A-F]/i.test(path),
    underscores: path.includes('_'),
    uppercase: /[A-Z]/.test(path),
    parameters: parsed.search.length > 1,
    multipleSlashes: /\/\/+/.test(path),
    repetitivePath: hasRepeatedSegment(segments),
    containsSpace: /%20|\s/.test(url),
    internalSearch: params.some((p) => INTERNAL_SEARCH_PARAMS.includes(p)) || /\/search(\/|$)/i.test(path),
    gaParameters: params.some((p) => GA_PARAMS.includes(p)),
    folderDepth: path.endsWith('/') ? segments.length : Math.max(segments.length - 1, 0)
  }
}

function hasRepeatedSegment(segments: string[]): boolean {
  const seen = new Set<string>()
  for (const s of segments) {
    const key = s.toLowerCase()
    if (seen.has(key)) return true
    seen.add(key)
  }
  return false
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
