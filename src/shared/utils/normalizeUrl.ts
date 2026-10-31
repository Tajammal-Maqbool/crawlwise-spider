export function normalizeUrl(raw: string, base?: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  let parsed: URL
  try {
    parsed = base ? new URL(trimmed, base) : new URL(trimmed)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  parsed.hash = ''
  return parsed.toString()
}
