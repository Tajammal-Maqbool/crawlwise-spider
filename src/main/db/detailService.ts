import type { DatabaseSync } from 'node:sqlite'
import { COLUMN_LIST } from '@shared/constants/columns'
import type { AccessibilityRow, DuplicateRow, HeaderRow, LinkRow, StructuredDataRow, UrlDetail } from '@shared/interfaces/urlDetail'
import { parseSetCookie } from '../utils/parseSetCookie'

interface RawLink {
  from_url: string
  to_url: string
  type: string
  anchor: string | null
  alt: string | null
  follow: number
  rel: string | null
  position: string | null
  path_type: string | null
  status_code: number | null
}

const LINK_SELECT = `SELECT s.url AS from_url, d.url AS to_url, l.type, l.anchor, l.alt, l.follow, l.rel,
  l.position, l.path_type, d.status_code
  FROM links l JOIN urls s ON s.id = l.src_id JOIN urls d ON d.id = l.dst_id`

const DETAIL_LIMIT = 5000
const RESOURCE_TYPES = new Set(['Image', 'CSS', 'JavaScript', 'Media', 'Font', 'Iframe'])

export function getUrlDetail(db: DatabaseSync, urlId: number): UrlDetail {
  const select = COLUMN_LIST.map((c) => `${c.sql} AS "${c.key}"`).join(', ')
  const row = (db.prepare(`SELECT ${select}, u.js_messages AS "__console" FROM urls u WHERE u.id = ?`).get(urlId) ?? {}) as Record<string, unknown>
  const url = String(row.address ?? '')
  const fields = COLUMN_LIST.filter((c) => row[c.key] !== null && row[c.key] !== undefined && row[c.key] !== '').map((c) => ({
    label: c.label,
    value: String(row[c.key])
  }))
  const inlinks = (db.prepare(`${LINK_SELECT} WHERE l.dst_id = ? LIMIT ${DETAIL_LIMIT}`).all(urlId) as unknown as RawLink[]).map(toLinkRow)
  const outlinks = (db.prepare(`${LINK_SELECT} WHERE l.src_id = ? LIMIT ${DETAIL_LIMIT}`).all(urlId) as unknown as RawLink[]).map(toLinkRow)
  const headers = db.prepare('SELECT name, value FROM headers WHERE url_id = ?').all(urlId) as unknown as HeaderRow[]
  const source = db.prepare('SELECT html FROM sources WHERE url_id = ?').get(urlId) as { html: string } | undefined
  const raw = db.prepare('SELECT html FROM raw_sources WHERE url_id = ?').get(urlId) as { html: string } | undefined
  const shot = db.prepare('SELECT png FROM screenshots WHERE url_id = ?').get(urlId) as { png: Uint8Array } | undefined
  return {
    url,
    fields,
    inlinks,
    outlinks,
    images: outlinks.filter((l) => l.type === 'Image'),
    resources: outlinks.filter((l) => RESOURCE_TYPES.has(l.type)),
    headers,
    cookies: url ? headers.filter((h) => h.name.toLowerCase() === 'set-cookie').map((h) => parseSetCookie(h.value, url)) : [],
    duplicates: db
      .prepare('SELECT o.url, n.similarity FROM near_duplicates n JOIN urls o ON o.id = n.other_id WHERE n.url_id = ? ORDER BY n.similarity DESC')
      .all(urlId) as unknown as DuplicateRow[],
    structuredData: db.prepare('SELECT format, type, errors, warnings FROM structured_data WHERE url_id = ?').all(urlId) as unknown as StructuredDataRow[],
    accessibility: db.prepare('SELECT rule, impact, tags, nodes, help FROM accessibility WHERE url_id = ? ORDER BY nodes DESC').all(urlId) as unknown as AccessibilityRow[],
    consoleLog: typeof row.__console === 'string' ? row.__console.split('\n') : [],
    source: raw?.html ?? source?.html ?? null,
    renderedSource: raw ? (source?.html ?? null) : null,
    screenshot: shot ? `data:image/png;base64,${Buffer.from(shot.png).toString('base64')}` : null
  }
}

function toLinkRow(r: RawLink): LinkRow {
  return {
    fromUrl: r.from_url,
    toUrl: r.to_url,
    type: r.type,
    anchor: r.anchor,
    alt: r.alt,
    follow: r.follow === 1,
    rel: r.rel,
    position: r.position,
    pathType: r.path_type,
    statusCode: r.status_code
  }
}
