import type { DatabaseSync } from 'node:sqlite'
import { MINHASH_SIZE, similarity } from './minhash'

const BANDS = 32
const ROWS = MINHASH_SIZE / BANDS

interface Signed {
  id: number
  url: string
  sig: Uint32Array
}

export function updateNearDuplicates(db: DatabaseSync, thresholdPercent: number): void {
  const rows = db
    .prepare("SELECT id, url, minhash FROM urls WHERE minhash IS NOT NULL AND state = 3 AND is_internal = 1 AND kind = 'html' AND indexability = 'Indexable'")
    .all() as Array<{ id: number; url: string; minhash: Uint8Array }>
  const pages: Signed[] = rows.map((r) => ({ id: r.id, url: r.url, sig: new Uint32Array(Uint8Array.from(r.minhash).buffer) }))
  const threshold = thresholdPercent / 100
  const best = new Map<number, { count: number; score: number; url: string | null }>()
  for (const p of pages) best.set(p.id, { count: 0, score: 0, url: null })

  const seen = new Set<string>()
  db.exec('DELETE FROM near_duplicates')
  const pair = db.prepare('INSERT INTO near_duplicates (url_id, other_id, similarity) VALUES (?, ?, ?)')
  for (let band = 0; band < BANDS; band += 1) {
    const buckets = new Map<string, Signed[]>()
    for (const p of pages) {
      const key = Array.from(p.sig.subarray(band * ROWS, band * ROWS + ROWS)).join(',')
      const list = buckets.get(key)
      if (list) list.push(p)
      else buckets.set(key, [p])
    }
    for (const list of buckets.values()) {
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const a = list[i]
          const b = list[j]
          const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`
          if (seen.has(pairKey)) continue
          seen.add(pairKey)
          const score = similarity(a.sig, b.sig)
          if (score < threshold) continue
          const percent = Math.round(score * 1000) / 10
          pair.run(a.id, b.id, percent)
          pair.run(b.id, a.id, percent)
          record(best, a.id, score, b.url)
          record(best, b.id, score, a.url)
        }
      }
    }
  }

  const update = db.prepare('UPDATE urls SET near_duplicate_count = ?, closest_similarity = ?, closest_similar_url = ? WHERE id = ?')
  for (const [id, b] of best) update.run(b.count, b.count ? Math.round(b.score * 1000) / 10 : null, b.url, id)
}

function record(best: Map<number, { count: number; score: number; url: string | null }>, id: number, score: number, url: string): void {
  const entry = best.get(id)
  if (!entry) return
  entry.count += 1
  if (score > entry.score) {
    entry.score = score
    entry.url = url
  }
}
