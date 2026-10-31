const DAY_MS = 86400000

export function searchConsoleDates(days: number, now: Date): { startDate: string; endDate: string } {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - DAY_MS
  const start = end - (Math.max(1, Math.floor(days)) - 1) * DAY_MS
  return { startDate: isoDate(start), endDate: isoDate(end) }
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}
