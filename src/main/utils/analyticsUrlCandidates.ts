import { normalizeUrl } from '@shared/utils/normalizeUrl'

export function analyticsUrlCandidates(host: string, path: string, startUrl: string): string[] {
  if (!host || host === '(not set)' || !path.startsWith('/')) return []
  const start = new URL(startUrl)
  const origin = host === start.hostname ? start.origin : `${start.protocol}//${host}`
  const primary = normalizeUrl(`${origin}${path}`)
  if (!primary) return []
  const other = new URL(primary)
  other.protocol = other.protocol === 'https:' ? 'http:' : 'https:'
  return [primary, other.toString()]
}
