export type PathType = 'Absolute' | 'Protocol-Relative' | 'Root-Relative' | 'Path-Relative'

export function pathTypeOf(href: string): PathType {
  const h = href.trim()
  if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return 'Absolute'
  if (h.startsWith('//')) return 'Protocol-Relative'
  if (h.startsWith('/')) return 'Root-Relative'
  return 'Path-Relative'
}
