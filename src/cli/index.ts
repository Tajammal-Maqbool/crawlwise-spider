import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { BULK_EXPORTS, ISSUES_REPORT_KEY } from '@shared/constants/bulkExports'
import { FILTERS, FILTERS_BY_KEY } from '@shared/constants/filterRegistry'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { mergeConfig } from '@shared/utils/mergeConfig'
import { redactSecrets } from '@shared/utils/redactSecrets'
import { openCrawlDb } from '../main/db/openCrawlDb'
import { writeMeta } from '../main/db/metaRepository'
import { CrawlEngine } from '../main/crawler/engine'
import { exportBulk, exportFilter } from '../main/services/exportService'
import { CLI_HELP, readCliOptions } from './cliOptions'

async function main(): Promise<number> {
  const opts = readCliOptions(process.argv.slice(2))
  if (opts.help || (!opts.crawl && !opts.list && !opts.listExports)) {
    process.stdout.write(CLI_HELP)
    return opts.help || opts.listExports ? 0 : 1
  }
  if (opts.listExports) {
    for (const f of FILTERS) process.stdout.write(`${f.key}\n`)
    for (const b of [...BULK_EXPORTS.map((x) => x.key), ISSUES_REPORT_KEY]) process.stdout.write(`${b}\n`)
    return 0
  }
  for (const key of opts.exportTabs) if (!FILTERS_BY_KEY[key]) throw new Error(`Unknown filter key: ${key} (see --list-exports)`)
  const known = new Set([...BULK_EXPORTS.map((x) => x.key), ISSUES_REPORT_KEY])
  for (const key of opts.bulkExports) if (!known.has(key)) throw new Error(`Unknown bulk export key: ${key} (see --list-exports)`)

  const config = buildConfig(opts.crawl, opts.list, opts.config)
  const out = resolve(opts.outputFolder)
  mkdirSync(out, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dbPath = join(out, `crawl-${stamp}.seospider.sqlite`)
  const db = openCrawlDb(dbPath)
  writeMeta(db, 'config', JSON.stringify(redactSecrets(config)))
  writeMeta(db, 'start_url', config.mode === 'list' ? `${config.listUrls.length} URLs (list)` : config.startUrl)
  writeMeta(db, 'mode', config.mode)
  writeMeta(db, 'created_at', new Date().toISOString())

  let last = 0
  const engine = new CrawlEngine(db, config, stamp, (p) => {
    if (Date.now() - last < 2000) return
    last = Date.now()
    process.stderr.write(`[${p.state}] crawled ${p.crawled}, queued ${p.queued}, ${p.urlsPerSecond} URL/s\n`)
  }, () => statSync(dbPath).size)
  process.on('SIGINT', () => engine.stop())
  const result = await engine.run(false)
  process.stderr.write(`Crawl ${result.state}: ${result.crawled} URLs. Database: ${dbPath}\n`)

  for (const key of opts.exportTabs) {
    const file = join(out, `${key.replace(':', '_')}.${opts.format}`)
    const rows = await exportFilter(db, key, config.thresholds, file)
    process.stderr.write(`Exported ${rows} rows to ${file}\n`)
  }
  for (const key of opts.bulkExports) {
    const file = join(out, `${key}.${opts.format}`)
    const rows = await exportBulk(db, key, config.thresholds, file)
    process.stderr.write(`Exported ${rows} rows to ${file}\n`)
  }
  db.close()
  return result.state === 'completed' ? 0 : 2
}

function buildConfig(crawl: string | null, list: string | null, configPath: string | null): CrawlConfig {
  const fromFile = configPath ? (JSON.parse(readFileSync(configPath, 'utf8')) as Partial<CrawlConfig>) : {}
  const config = mergeConfig(fromFile)
  if (list) {
    if (!existsSync(list)) throw new Error(`List file not found: ${list}`)
    const urls = readFileSync(list, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => /^https?:\/\//i.test(l))
    return { ...config, mode: 'list', listUrls: urls }
  }
  return { ...config, mode: 'spider', startUrl: crawl ?? '' }
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  }
)
