import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import { CrawlLibrary } from '../../src/main/services/crawlLibrary'
import { writeMeta } from '../../src/main/db/metaRepository'
import { openCrawlDb } from '../../src/main/db/openCrawlDb'

let dir: string
let library: CrawlLibrary

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'seo-spider-lib-'))
  library = new CrawlLibrary(dir)
})

afterEach(() => {
  library.closeAll()
  rmSync(dir, { recursive: true, force: true })
})

function crawlWithState(state: string): string {
  const id = library.create({ ...DEFAULT_CONFIG, startUrl: 'http://example.test/' })
  const db = openCrawlDb(library.pathOf(id))
  writeMeta(db, 'state', state)
  db.close()
  return id
}

describe('stale crawl state recovery', () => {
  it.each(['crawling', 'analysing'])('lists a stored %s crawl as paused', (state) => {
    const id = crawlWithState(state)
    expect(library.list().find((s) => s.id === id)?.state).toBe('paused')
  })

  it('persists paused when the crawl is opened', () => {
    const id = crawlWithState('crawling')
    library.reader(id)
    library.closeAll()
    const db = openCrawlDb(library.pathOf(id))
    const row = db.prepare("SELECT value FROM meta WHERE key = 'state'").get() as { value: string }
    db.close()
    expect(row.value).toBe('paused')
  })

  it('leaves the live crawl alone', () => {
    const id = crawlWithState('crawling')
    library.setLiveCheck((candidate) => candidate === id)
    expect(library.list().find((s) => s.id === id)?.state).toBe('crawling')
  })

  it('leaves finished states alone', () => {
    const id = crawlWithState('completed')
    expect(library.list().find((s) => s.id === id)?.state).toBe('completed')
  })
})
