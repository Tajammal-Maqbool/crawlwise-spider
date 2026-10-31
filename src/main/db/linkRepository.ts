import type { DatabaseSync, StatementSync } from 'node:sqlite'
import type { ExtractedLink } from '../interfaces/parsedPage'

export class LinkRepository {
  private readonly insertLink: StatementSync
  private readonly insertHeader: StatementSync
  private readonly insertSource: StatementSync

  constructor(db: DatabaseSync) {
    this.insertLink = db.prepare(`INSERT INTO links
      (src_id, dst_id, type, anchor, alt, rel, follow, target, position, path_type, has_dimensions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    this.insertHeader = db.prepare('INSERT INTO headers (url_id, name, value) VALUES (?, ?, ?)')
    this.insertSource = db.prepare('INSERT OR REPLACE INTO sources (url_id, html) VALUES (?, ?)')
  }

  addLink(srcId: number, dstId: number, link: Pick<ExtractedLink, 'type'> & Partial<ExtractedLink>): void {
    this.insertLink.run(
      srcId,
      dstId,
      link.type,
      link.anchor ?? null,
      link.alt ?? null,
      link.rel ?? null,
      link.follow === false ? 0 : 1,
      link.target ?? null,
      link.position ?? null,
      link.pathType ?? null,
      link.hasDimensions == null ? null : link.hasDimensions ? 1 : 0
    )
  }

  addHeaders(urlId: number, headers: Array<[string, string]>): void {
    for (const [name, value] of headers) this.insertHeader.run(urlId, name, value)
  }

  addSource(urlId: number, html: string): void {
    this.insertSource.run(urlId, html)
  }
}
