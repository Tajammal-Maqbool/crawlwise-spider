import type { DatabaseSync, StatementSync } from 'node:sqlite'
import type { ExtractedLink } from '../interfaces/parsedPage'
import type { ProcessedPage } from '../interfaces/processedPage'
import type { UrlRepository } from './urlRepository'
import type { LinkRepository } from './linkRepository'

const MAX_STORED_SOURCE_CHARS = 2 * 1024 * 1024

export class PageStore {
  private readonly hreflang: StatementSync
  private readonly structured: StatementSync
  private readonly custom: StatementSync
  private readonly sitemapEntry: StatementSync
  private readonly a11y: StatementSync
  private readonly raw: StatementSync
  private readonly shot: StatementSync

  constructor(
    private readonly db: DatabaseSync,
    private readonly urls: UrlRepository,
    private readonly links: LinkRepository
  ) {
    this.hreflang = db.prepare('INSERT INTO hreflang (url_id, lang, target, source) VALUES (?, ?, ?, ?)')
    this.structured = db.prepare('INSERT INTO structured_data (url_id, format, type, errors, warnings) VALUES (?, ?, ?, ?, ?)')
    this.custom = db.prepare('INSERT INTO custom_values (url_id, kind, slot, value) VALUES (?, ?, ?, ?)')
    this.a11y = db.prepare('INSERT INTO accessibility (url_id, rule, impact, tags, nodes, help) VALUES (?, ?, ?, ?, ?, ?)')
    this.raw = db.prepare('INSERT OR REPLACE INTO raw_sources (url_id, html) VALUES (?, ?)')
    this.shot = db.prepare('INSERT OR REPLACE INTO screenshots (url_id, png) VALUES (?, ?)')
    this.sitemapEntry = db.prepare('INSERT OR IGNORE INTO sitemap_entries (sitemap_id, url_id) VALUES (?, ?)')
  }

  save(urlId: number, page: ProcessedPage, discover: (link: ExtractedLink) => number): void {
    this.db.exec('BEGIN')
    try {
      this.urls.update(urlId, page.fields)
      this.links.addHeaders(urlId, page.headers)
      if (page.html !== null && page.html.length <= MAX_STORED_SOURCE_CHARS) this.links.addSource(urlId, page.html)
      if (page.rawHtml !== null && page.rawHtml.length <= MAX_STORED_SOURCE_CHARS) this.raw.run(urlId, page.rawHtml)
      if (page.screenshot) this.shot.run(urlId, page.screenshot)
      for (const h of page.hreflang) this.hreflang.run(urlId, h.lang, h.target, h.source)
      for (const s of page.structured) {
        this.structured.run(urlId, s.format, s.type, join([...s.errors, ...s.richErrors]), join([...s.warnings, ...s.richWarnings]))
      }
      for (const v of page.accessibility) this.a11y.run(urlId, v.rule, v.impact, `,${v.tags.join(',')},`, v.nodes, v.help)
      for (const c of page.custom) this.custom.run(urlId, c.kind, c.slot, c.value)
      const ids = new Map<string, number>()
      for (const link of page.discovered) ids.set(link.url, discover(link))
      for (const entry of page.sitemapEntries) {
        const id = ids.get(entry)
        if (id !== undefined) this.sitemapEntry.run(urlId, id)
      }
      this.db.exec('COMMIT')
    } catch (err) {
      this.db.exec('ROLLBACK')
      throw err
    }
  }
}

function join(lines: string[]): string | null {
  return lines.length ? lines.join('\n') : null
}
