export function percentOf(part: number, total: number): string {
  return total > 0 ? `${(Math.round((part / total) * 1000) / 10).toFixed(1)}%` : '0.0%'
}
