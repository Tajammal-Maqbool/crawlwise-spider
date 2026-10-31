import type { DatabaseSync } from 'node:sqlite'
import { INTERNAL } from '@shared/constants/filterRegistry/bases'
import { RESPONSE_TIME_BUCKET_SECONDS } from '@shared/constants/responseTimeBuckets'
import type { ApiStatusRow, DepthStat, ResponseTimeStats } from '@shared/interfaces/crawlStats'

const percent = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0)

export function getDepthStats(db: DatabaseSync): DepthStat[] {
  const rows = db.prepare(`SELECT coalesce(u.depth, 0) AS depth, count(*) AS urls FROM urls u WHERE ${INTERNAL()} GROUP BY 1 ORDER BY 1`).all() as Array<{ depth: number; urls: number }>
  const total = rows.reduce((s, r) => s + r.urls, 0)
  return rows.map((r) => ({ ...r, percent: percent(r.urls, total) }))
}

export function getResponseTimes(db: DatabaseSync): ResponseTimeStats {
  const rows = db
    .prepare(`SELECT min(CAST(u.response_time_ms / 1000 AS INTEGER), ${RESPONSE_TIME_BUCKET_SECONDS}) AS bucket, count(*) AS urls, sum(u.response_time_ms) AS ms
      FROM urls u WHERE ${INTERNAL()} AND u.response_time_ms IS NOT NULL GROUP BY 1`)
    .all() as Array<{ bucket: number; urls: number; ms: number }>
  const total = rows.reduce((s, r) => s + r.urls, 0)
  const byBucket = new Map(rows.map((r) => [r.bucket, r.urls]))
  const buckets = Array.from({ length: RESPONSE_TIME_BUCKET_SECONDS + 1 }, (_, i) => {
    const urls = byBucket.get(i) ?? 0
    const label = i === RESPONSE_TIME_BUCKET_SECONDS ? `Over ${i}` : `${i} - ${i + 1}`
    return { label, urls, percent: percent(urls, total) }
  })
  const ms = rows.reduce((s, r) => s + r.ms, 0)
  return { buckets, averageSeconds: total > 0 ? Math.round(ms / total) / 1000 : 0 }
}

export function getApiStatus(db: DatabaseSync): ApiStatusRow[] {
  const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n
  const rows: ApiStatusRow[] = [
    { name: 'Search Console', withData: count('SELECT count(*) AS n FROM urls WHERE gsc_has_data = 1'), errors: 0 },
    {
      name: 'URL Inspection',
      withData: count("SELECT count(*) AS n FROM urls WHERE gsc_inspection_status = 'Success'"),
      errors: count("SELECT count(*) AS n FROM urls WHERE gsc_inspection_status <> 'Success'")
    },
    { name: 'GA4', withData: count('SELECT count(*) AS n FROM urls WHERE ga_has_data = 1'), errors: 0 },
    {
      name: 'PageSpeed Insights',
      withData: count("SELECT count(*) AS n FROM urls WHERE psi_status = 'Success'"),
      errors: count("SELECT count(*) AS n FROM urls WHERE psi_status <> 'Success'")
    },
    {
      name: 'AI',
      withData: count("SELECT count(DISTINCT url_id) AS n FROM custom_values WHERE kind = 'ai' AND value NOT LIKE 'Error:%'"),
      errors: count("SELECT count(DISTINCT url_id) AS n FROM custom_values WHERE kind = 'ai' AND value LIKE 'Error:%'")
    }
  ]
  return rows.filter((r) => r.withData + r.errors > 0)
}
