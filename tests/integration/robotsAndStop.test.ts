import { afterEach, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import { openCrawlDb } from '../../src/main/db/openCrawlDb'
import { CrawlEngine } from '../../src/main/crawler/engine'
import { startFixtureSite } from '../fixtures/fixtureSite'

interface Rig {
  server: Server
  db: DatabaseSync
  dir: string
  requests: string[]
  url: string
}

const rigs: Rig[] = []

async function rig(robots: { status: number; body?: string }): Promise<Rig> {
  const requests: string[] = []
  const html = (links: string) => `<html><head><title>T</title></head><body><h1>H</h1>${links}</body></html>`
  const server = createServer((req, res) => {
    requests.push(req.url ?? '')
    if (req.url === '/robots.txt') {
      res.writeHead(robots.status, { 'content-type': 'text/plain' })
      res.end(robots.body ?? '')
    } else if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end(html('<a href="/a">a</a>'))
    } else {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end(html(''))
    }
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const dir = mkdtempSync(join(tmpdir(), 'seo-spider-robots-'))
  const created = { server, db: openCrawlDb(join(dir, 'c.sqlite')), dir, requests, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/` }
  rigs.push(created)
  return created
}

afterEach(async () => {
  for (const r of rigs.splice(0)) {
    r.db.close()
    await new Promise((resolve) => r.server.close(resolve))
    rmSync(r.dir, { recursive: true, force: true })
  }
})

const run = (r: Rig, ignoreRobots = false) =>
  new CrawlEngine(r.db, { ...DEFAULT_CONFIG, startUrl: r.url, respectRobotsTxt: !ignoreRobots }, 't', () => undefined, () => 0).run(false)

describe('robots.txt failure handling', () => {
  it('allows everything when robots.txt is 404', async () => {
    const r = await rig({ status: 404 })
    const result = await run(r)
    expect(result.state).toBe('completed')
    expect(r.requests).toContain('/a')
  })

  it('disallows the whole origin when robots.txt is 503, and warns', async () => {
    const r = await rig({ status: 503 })
    const result = await run(r)
    expect(r.requests).not.toContain('/')
    expect(r.requests).not.toContain('/a')
    expect(result.message).toMatch(/robots\.txt/)
  }, 30000)

  it('parses a 200 robots.txt normally', async () => {
    const r = await rig({ status: 200, body: 'User-agent: *\nDisallow: /a\n' })
    await run(r)
    expect(r.requests).toContain('/')
    expect(r.requests).not.toContain('/a')
  })

  it('ignores a failing robots.txt when robots are ignored', async () => {
    const r = await rig({ status: 503 })
    await run(r, true)
    expect(r.requests).toContain('/a')
  }, 30000)

  it('honours crawl-delay between requests', async () => {
    const r = await rig({ status: 200, body: 'User-agent: *\nCrawl-delay: 1\n' })
    const start = Date.now()
    await run(r)
    expect(Date.now() - start).toBeGreaterThanOrEqual(900)
  })
})

describe('stop during analysis', () => {
  it('keeps the stopped state', async () => {
    const site = await startFixtureSite()
    const dir = mkdtempSync(join(tmpdir(), 'seo-spider-stop-'))
    const db = openCrawlDb(join(dir, 'c.sqlite'))
    const holder: { engine?: CrawlEngine } = {}
    const config = { ...DEFAULT_CONFIG, startUrl: site.url, limits: { ...DEFAULT_CONFIG.limits, maxUrls: 3 } }
    const engine = new CrawlEngine(db, config, 't', (p) => {
      if (p.state === 'analysing') holder.engine?.stop()
    }, () => 0)
    holder.engine = engine
    const result = await engine.run(false)
    const row = db.prepare("SELECT value FROM meta WHERE key = 'state'").get() as { value: string }
    db.close()
    await site.close()
    rmSync(dir, { recursive: true, force: true })
    expect(result.state).toBe('stopped')
    expect(row.value).toBe('stopped')
  })
})
