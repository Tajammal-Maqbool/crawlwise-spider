export function isAppUrl(target: string, appUrl: string): boolean {
  try {
    const a = new URL(target)
    const b = new URL(appUrl)
    if (b.protocol === 'file:') return a.protocol === 'file:' && a.pathname === b.pathname
    return a.origin === b.origin
  } catch {
    return false
  }
}
