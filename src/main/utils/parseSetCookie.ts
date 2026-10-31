import type { CookieRow } from '@shared/interfaces/urlDetail'

export function parseSetCookie(header: string, sampleUrl: string): CookieRow {
  const [pair, ...attributes] = header.split(';').map((p) => p.trim())
  const eq = pair.indexOf('=')
  const attrs = new Map<string, string>()
  for (const a of attributes) {
    const i = a.indexOf('=')
    attrs.set((i < 0 ? a : a.slice(0, i)).toLowerCase(), i < 0 ? '' : a.slice(i + 1))
  }
  const maxAge = attrs.get('max-age')
  const expires = maxAge !== undefined && Number(maxAge) <= 0 ? 'Immediate' : (attrs.get('expires') ?? (maxAge !== undefined ? `${maxAge} seconds` : 'End of Session'))
  return {
    name: eq < 0 ? pair : pair.slice(0, eq),
    value: eq < 0 ? '' : pair.slice(eq + 1),
    domain: attrs.get('domain') || new URL(sampleUrl).hostname,
    path: attrs.get('path') || '/',
    expires,
    sameSite: attrs.get('samesite') ?? '',
    secure: attrs.has('secure'),
    httpOnly: attrs.has('httponly')
  }
}
