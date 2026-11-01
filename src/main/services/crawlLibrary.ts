import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { CrawlSummary } from '@shared/interfaces/crawlSummary'
import type { CrawlMode, CrawlState } from '@shared/types/crawlState'
import { mergeConfig } from '@shared/utils/mergeConfig'
import { redactSecrets } from '@shared/utils/redactSecrets'
import { openCrawlDb } from '../db/openCrawlDb'
import { readMeta, writeMeta } from '../db/metaRepository'
import { recoverStaleState } from '../utils/staleCrawlState'

const EXTENSION = '.seospider.sqlite'

export class CrawlLibrary {
  private readonly readers = new Map<string, DatabaseSync>()
  private isLive: (id: string) => boolean = () => false

  constructor(private readonly dir: string) {
    mkdirSync(dir, { recursive: true })
  }

  setLiveCheck(isLive: (id: string) => boolean): void {
    this.isLive = isLive
  }

  pathOf(id: string): string {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('Invalid crawl id')
    return join(this.dir, `${id}${EXTENSION}`)
  }

  create(config: CrawlConfig): string {
    const id = randomUUID()
    const db = openCrawlDb(this.pathOf(id))
    writeMeta(db, 'config', JSON.stringify(redactSecrets(config)))
    writeMeta(db, 'start_url', config.mode === 'list' ? `${config.listUrls.length} URLs (list)` : config.startUrl)
    writeMeta(db, 'mode', config.mode)
    writeMeta(db, 'created_at', new Date().toISOString())
    writeMeta(db, 'state', 'idle')
    db.close()
    return id
  }

  reader(id: string): DatabaseSync {
    let db = this.readers.get(id)
    if (!db) {
      db = openCrawlDb(this.pathOf(id))
      this.readers.set(id, db)
      this.recoverState(db, id)
    }
    return db
  }

  config(id: string): CrawlConfig {
    return mergeConfig(JSON.parse(readMeta(this.reader(id), 'config') ?? '{}') as Partial<CrawlConfig>)
  }

  list(): CrawlSummary[] {
    return readdirSync(this.dir)
      .filter((f) => f.endsWith(EXTENSION))
      .map((f) => f.slice(0, -EXTENSION.length))
      .map((id) => this.summary(id))
      .filter((s): s is CrawlSummary => s !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  delete(id: string): void {
    this.readers.get(id)?.close()
    this.readers.delete(id)
    const path = this.pathOf(id)
    for (const suffix of ['', '-wal', '-shm']) rmSync(`${path}${suffix}`, { force: true })
  }

  closeAll(): void {
    for (const db of this.readers.values()) db.close()
    this.readers.clear()
  }

  private recoverState(db: DatabaseSync, id: string): CrawlState {
    const stored = readMeta(db, 'state') ?? 'idle'
    const state = recoverStaleState(stored, this.isLive(id))
    if (state !== stored) writeMeta(db, 'state', state)
    return state
  }

  private summary(id: string): CrawlSummary | null {
    try {
      const db = this.reader(id)
      const count = db.prepare('SELECT count(*) AS n FROM urls WHERE state = 3').get() as { n: number }
      const path = this.pathOf(id)
      const wal = `${path}-wal`
      return {
        id,
        startUrl: readMeta(db, 'start_url') ?? '',
        mode: (readMeta(db, 'mode') ?? 'spider') as CrawlMode,
        state: this.recoverState(db, id),
        createdAt: readMeta(db, 'created_at') ?? '',
        urlCount: count.n,
        fileSizeBytes: statSync(path).size + (existsSync(wal) ? statSync(wal).size : 0)
      }
    } catch {
      return null
    }
  }
}
