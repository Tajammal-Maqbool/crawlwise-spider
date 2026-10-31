import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { startFixtureSite, type FixtureSite } from '../fixtures/fixtureSite'

const CLI = resolve(import.meta.dirname, '../../out/main/cli.js')
let site: FixtureSite
let out: string

beforeAll(async () => {
  site = await startFixtureSite()
  out = mkdtempSync(join(tmpdir(), 'seo-spider-cli-'))
})

afterAll(async () => {
  await site?.close()
  rmSync(out, { recursive: true, force: true })
})

const runCli = (args: string[]) =>
  new Promise<{ status: number | null; stderr: string }>((done) => {
    const proc = spawn(process.execPath, [CLI, ...args], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (d) => (stderr += String(d)))
    proc.on('close', (status) => done({ status, stderr }))
  })

describe('headless CLI', () => {
  it('crawls, saves the database and writes exports', async () => {
    const r = await runCli(['--crawl', site.url, '--output-folder', out, '--export-tabs', 'page-titles:missing,response-codes:internal-client-error', '--bulk-export', 'inlinks-4xx,issues-overview'])
    expect(r.status, r.stderr).toBe(0)
    const files = readdirSync(out)
    expect(files.some((f) => f.endsWith('.seospider.sqlite'))).toBe(true)
    expect(readFileSync(join(out, 'page-titles_missing.csv'), 'utf8')).toContain('/missing-title')
    expect(readFileSync(join(out, 'inlinks-4xx.csv'), 'utf8')).toContain('/does-not-exist')
    expect(readFileSync(join(out, 'issues-overview.csv'), 'utf8')).toContain('Internal Client Error (4xx)')
  })

  it('rejects unknown export keys', async () => {
    const r = await runCli(['--crawl', site.url, '--export-tabs', 'nope:nope'])
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('Unknown filter key')
  })
})
