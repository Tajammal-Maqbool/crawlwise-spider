export function invalidPatterns(patterns: string[]): string[] {
  return patterns.filter((p) => {
    try {
      new RegExp(p)
      return false
    } catch {
      return true
    }
  })
}
