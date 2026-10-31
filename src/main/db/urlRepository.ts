import type { DatabaseSync, StatementSync } from 'node:sqlite'
import { URL_STATE } from '@shared/types/urlState'
import { computeUrlFlags } from '@shared/utils/urlFlags'
import type { SqlValue } from '../types/sqlValue'

export interface UrlRef {
  id: number
  url: string
  state: number
  depth: number
  isInternal: boolean
}

export interface QueuedUrl {
  id: number
  url: string
  depth: number
  isInternal: boolean
}

export class UrlRepository {
  private readonly insertStmt: StatementSync
  private readonly selectStmt: StatementSync
  private readonly enqueueStmt: StatementSync
  private readonly updateCache = new Map<string, StatementSync>()
  private seq: number

  constructor(private readonly db: DatabaseSync) {
    this.insertStmt = db.prepare(`INSERT OR IGNORE INTO urls (
      url, host, scheme, is_internal, depth, folder_depth, found_via, url_len, url_non_ascii, url_underscores,
      url_uppercase, url_parameters, url_multiple_slashes, url_repetitive_path, url_contains_space,
      url_internal_search, url_ga_parameters
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    this.selectStmt = db.prepare('SELECT id, url, state, depth, is_internal FROM urls WHERE url = ?')
    this.enqueueStmt = db.prepare('UPDATE urls SET state = 1, queue_seq = ? WHERE id = ? AND state = 0')
    const row = db.prepare('SELECT coalesce(max(queue_seq), 0) AS m FROM urls').get() as { m: number }
    this.seq = row.m
  }

  discover(url: string, isInternal: boolean, depth: number, foundVia: string): UrlRef {
    const parsed = new URL(url)
    const f = computeUrlFlags(url)
    this.insertStmt.run(
      url, parsed.hostname, parsed.protocol.replace(':', ''), b(isInternal), depth, f.folderDepth, foundVia,
      f.urlLen, b(f.nonAscii), b(f.underscores), b(f.uppercase), b(f.parameters), b(f.multipleSlashes),
      b(f.repetitivePath), b(f.containsSpace), b(f.internalSearch), b(f.gaParameters)
    )
    return this.find(url) as UrlRef
  }

  find(url: string): UrlRef | null {
    const row = this.selectStmt.get(url) as { id: number; url: string; state: number; depth: number; is_internal: number } | undefined
    return row ? { id: row.id, url: row.url, state: row.state, depth: row.depth, isInternal: row.is_internal === 1 } : null
  }

  enqueue(id: number): boolean {
    this.seq += 1
    return Number(this.enqueueStmt.run(this.seq, id).changes) > 0
  }

  takeBatch(limit: number): QueuedUrl[] {
    const rows = this.db
      .prepare('SELECT id, url, depth, is_internal FROM urls WHERE state = 1 ORDER BY queue_seq LIMIT ?')
      .all(limit) as Array<{ id: number; url: string; depth: number; is_internal: number }>
    const mark = this.db.prepare('UPDATE urls SET state = 2 WHERE id = ?')
    for (const r of rows) mark.run(r.id)
    return rows.map((r) => ({ id: r.id, url: r.url, depth: r.depth, isInternal: r.is_internal === 1 }))
  }

  requeueInProgress(): void {
    this.db.exec(`UPDATE urls SET state = ${URL_STATE.queued} WHERE state = ${URL_STATE.inProgress}`)
  }

  update(id: number, fields: Record<string, SqlValue>): void {
    const keys = Object.keys(fields)
    if (keys.length === 0) return
    const signature = keys.join(',')
    let stmt = this.updateCache.get(signature)
    if (!stmt) {
      stmt = this.db.prepare(`UPDATE urls SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`)
      this.updateCache.set(signature, stmt)
    }
    stmt.run(...keys.map((k) => fields[k]), id)
  }

  counts(): { crawled: number; queued: number; discovered: number } {
    const row = this.db
      .prepare(`SELECT
        sum(CASE WHEN state = 3 THEN 1 ELSE 0 END) AS crawled,
        sum(CASE WHEN state IN (1, 2) THEN 1 ELSE 0 END) AS queued,
        count(*) AS discovered
      FROM urls`)
      .get() as { crawled: number | null; queued: number | null; discovered: number }
    return { crawled: row.crawled ?? 0, queued: row.queued ?? 0, discovered: row.discovered }
  }
}

function b(value: boolean): number {
  return value ? 1 : 0
}
