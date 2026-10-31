import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import type { ScheduledTask } from '@shared/interfaces/scheduledTask'
import { buildCmdFile, buildCreateArgs, buildTaskXml, validateTask } from '../../src/main/services/scheduleCommands'
import { startFixtureSite, type FixtureSite } from '../fixtures/fixtureSite'
import { ELECTRON_PATH as ELECTRON, launchEnv, ROOT } from '../fixtures/launchApp'

const CLI = join(ROOT, 'out', 'main', 'cli.js')

let site: FixtureSite
let dir: string

const task = (over: Partial<ScheduledTask> = {}): ScheduledTask => ({
  id: '00000000-0000-4000-8000-000000000001',
  createdAt: '2026-10-21T00:00:00Z',
  name: 'Weekly <check> & report',
  startUrl: 'https://example.com/',
  frequency: 'weekly',
  date: '2026-10-21',
  time: '09:30',
  outputFolder: 'C:\\out',
  exportTabs: ['page-titles:missing'],
  bulkExports: ['issues-overview'],
  format: 'csv',
  ...over
})

beforeAll(async () => {
  site = await startFixtureSite()
  dir = mkdtempSync(join(tmpdir(), 'seo-spider-schedule-'))
})

afterAll(async () => {
  await site?.close()
  rmSync(dir, { recursive: true, force: true })
})

describe('scheduling', () => {
  it('builds a locale-independent task definition', () => {
    const xml = buildTaskXml(task(), 'C:\\tasks\\a.cmd')
    expect(xml).toContain('<StartBoundary>2026-10-21T09:30:00</StartBoundary>')
    expect(xml).toContain('<Wednesday />')
    expect(xml).toContain('Weekly &lt;check&gt; &amp; report')
    expect(buildTaskXml(task({ frequency: 'monthly' }), 'x')).toContain('<Day>21</Day>')
    expect(buildTaskXml(task({ frequency: 'once' }), 'x')).toContain('<TimeTrigger>')
    expect(buildCreateArgs('abc', 'C:\\t.xml')).toEqual(['/Create', '/TN', 'CrawlwiseSpider\\abc', '/XML', 'C:\\t.xml', '/F'])
  })

  it('rejects bad input', () => {
    expect(validateTask(task({ startUrl: 'example.com' }))).toMatch(/http/)
    expect(validateTask(task({ time: '25:00' }))).toMatch(/HH:MM/)
    expect(validateTask(task({ outputFolder: 'C:\\a"b' }))).toMatch(/quotes/)
    expect(validateTask(task())).toBeNull()
  })

  it('runs the generated command file against a real site', async () => {
    const out = join(dir, 'out')
    const configPath = join(dir, 'config.json')
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG))
    const cmdPath = join(dir, 'run.cmd')
    writeFileSync(cmdPath, buildCmdFile(task({ startUrl: site.url, outputFolder: out }), ELECTRON, CLI, configPath))
    const env = launchEnv()
    const code = await new Promise<number | null>((done) => {
      const proc = spawn('cmd.exe', ['/c', cmdPath], { env, stdio: 'ignore', windowsHide: true })
      proc.on('close', done)
    })
    expect(code).toBe(0)
    const files = readdirSync(out)
    expect(files).toContain('page-titles_missing.csv')
    expect(files).toContain('issues-overview.csv')
  }, 120000)
})
