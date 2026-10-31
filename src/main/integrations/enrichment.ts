import type { DatabaseSync } from 'node:sqlite'
import * as cheerio from 'cheerio'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { UrlRepository } from '../db/urlRepository'
import { fetchPageSpeed } from './pageSpeedClient'
import { createAnthropicRunner } from './anthropicPrompt'
import { createOllamaRunner } from './ollamaPrompt'
import type { EnrichmentRow } from '../interfaces/enrichmentRow'
import type { GoogleApiContext } from '../interfaces/googleApi'
import { runPool } from '../utils/runPool'
import { runUrlInspection } from './urlInspection'

const CONCURRENCY = 2
const PAGES = "state = 3 AND is_internal = 1 AND kind = 'html' AND status_code BETWEEN 200 AND 299"
const PAGES_U = "u.state = 3 AND u.is_internal = 1 AND u.kind = 'html' AND u.status_code BETWEEN 200 AND 299"

export type EnrichmentProgress = (message: string) => void
export type StopCheck = () => boolean

export async function runEnrichment(
  db: DatabaseSync,
  config: CrawlConfig,
  google: GoogleApiContext | null,
  progress: EnrichmentProgress,
  stopped: StopCheck
): Promise<string[]> {
  const { pagespeed, ai, searchConsole } = config.integrations
  const warnings: string[] = []
  if (searchConsole.enabled && searchConsole.urlInspection && google) warnings.push(...(await runUrlInspection(db, searchConsole, google, progress, stopped)))
  if (pagespeed.enabled) await runPageSpeed(db, config, progress, stopped)
  if (ai.enabled && ai.prompts.some((p) => p.prompt.trim())) await runAi(db, config, progress, stopped)
  progress('')
  return warnings
}

async function runPageSpeed(db: DatabaseSync, config: CrawlConfig, progress: EnrichmentProgress, stopped: StopCheck): Promise<void> {
  const options = config.integrations.pagespeed
  const rows = db.prepare(`SELECT id, url FROM urls WHERE ${PAGES} AND psi_status IS NULL ORDER BY depth, id LIMIT ?`).all(options.maxPages) as Array<{ id: number; url: string }>
  const urls = new UrlRepository(db)
  let done = 0
  await runPool(rows, CONCURRENCY, stopped, async (row) => {
    urls.update(row.id, await fetchPageSpeed(row.url, options))
    done += 1
    progress(`PageSpeed ${done}/${rows.length}`)
  })
}

async function runAi(db: DatabaseSync, config: CrawlConfig, progress: EnrichmentProgress, stopped: StopCheck): Promise<void> {
  const options = config.integrations.ai
  const ask = options.provider === 'ollama' ? createOllamaRunner(options) : createAnthropicRunner(options)
  const rows = db
    .prepare(`SELECT u.id, u.url, u.title, u.meta_description, s.html FROM urls u LEFT JOIN sources s ON s.url_id = u.id
      WHERE ${PAGES_U} AND NOT EXISTS (SELECT 1 FROM custom_values v WHERE v.url_id = u.id AND v.kind = 'ai')
      ORDER BY u.depth, u.id LIMIT ?`)
    .all(options.maxPages) as unknown as EnrichmentRow[]
  const insert = db.prepare("INSERT INTO custom_values (url_id, kind, slot, value) VALUES (?, 'ai', ?, ?)")
  let done = 0
  await runPool(rows, CONCURRENCY, stopped, async (row) => {
    const context = pageContext(row, options.maxInputChars)
    for (const [slot, p] of options.prompts.entries()) {
      if (!p.prompt.trim()) continue
      const answer = await ask(`${p.prompt}\n\n${context}`)
      insert.run(row.id, slot, answer)
    }
    done += 1
    progress(`AI prompts ${done}/${rows.length}`)
  })
}

export function pageContext(row: EnrichmentRow, maxChars: number): string {
  const text = row.html ? cheerio.load(row.html)('body').text().replace(/\s+/g, ' ').trim() : ''
  const clipped = text.length > maxChars ? `${text.slice(0, maxChars)}\n[Text cut at ${maxChars} characters by the crawler setting]` : text
  return `Page URL: ${row.url}\nTitle: ${row.title ?? ''}\nMeta description: ${row.meta_description ?? ''}\n\nPage text:\n${clipped}`
}
