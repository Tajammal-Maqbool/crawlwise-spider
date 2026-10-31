import type { DatabaseSync } from 'node:sqlite'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { LOCALHOST_HOSTS, NON_DESCRIPTIVE_ANCHORS } from '../constants/anchorText'
import { updateNearDuplicates } from './nearDuplicates'

export function runPostCrawlAnalysis(db: DatabaseSync, startHost: string, config: CrawlConfig): void {
  db.exec('BEGIN')
  try {
    updateLinkCounts(db, startHost)
    updateRedirectChains(db)
    if (config.content.nearDuplicates) updateNearDuplicates(db, config.content.nearDuplicateThreshold)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

function updateLinkCounts(db: DatabaseSync, startHost: string): void {
  const anchors = [...NON_DESCRIPTIVE_ANCHORS].map((a) => `'${a.replace(/'/g, "''")}'`).join(', ')
  const localhosts = LOCALHOST_HOSTS.has(startHost)
    ? "''"
    : [...LOCALHOST_HOSTS].map((h) => `'${h}'`).join(', ')
  db.exec(`
    UPDATE urls SET
      inlinks = (SELECT count(*) FROM links l WHERE l.dst_id = urls.id AND l.type = 'Hyperlink'),
      unique_inlinks = (SELECT count(DISTINCT l.src_id) FROM links l WHERE l.dst_id = urls.id AND l.type = 'Hyperlink'),
      follow_inlinks = (SELECT count(*) FROM links l WHERE l.dst_id = urls.id AND l.type = 'Hyperlink' AND l.follow = 1),
      nofollow_inlinks = (SELECT count(*) FROM links l WHERE l.dst_id = urls.id AND l.type = 'Hyperlink' AND l.follow = 0),
      indexable_inlinks = (SELECT count(DISTINCT l.src_id) FROM links l JOIN urls s ON s.id = l.src_id
        WHERE l.dst_id = urls.id AND l.type = 'Hyperlink' AND s.indexability = 'Indexable');

    UPDATE urls SET
      outlinks = (SELECT count(*) FROM links l JOIN urls d ON d.id = l.dst_id
        WHERE l.src_id = urls.id AND l.type = 'Hyperlink' AND d.is_internal = 1),
      unique_outlinks = (SELECT count(DISTINCT l.dst_id) FROM links l JOIN urls d ON d.id = l.dst_id
        WHERE l.src_id = urls.id AND l.type = 'Hyperlink' AND d.is_internal = 1 AND l.dst_id <> urls.id),
      external_outlinks = (SELECT count(*) FROM links l JOIN urls d ON d.id = l.dst_id
        WHERE l.src_id = urls.id AND l.type = 'Hyperlink' AND d.is_internal = 0),
      unique_external_outlinks = (SELECT count(DISTINCT l.dst_id) FROM links l JOIN urls d ON d.id = l.dst_id
        WHERE l.src_id = urls.id AND l.type = 'Hyperlink' AND d.is_internal = 0),
      nofollow_outlinks = (SELECT count(*) FROM links l JOIN urls d ON d.id = l.dst_id
        WHERE l.src_id = urls.id AND l.type = 'Hyperlink' AND d.is_internal = 1 AND l.follow = 0),
      no_anchor_outlinks = (SELECT count(*) FROM links l JOIN urls d ON d.id = l.dst_id
        WHERE l.src_id = urls.id AND l.type = 'Hyperlink' AND d.is_internal = 1
        AND coalesce(l.anchor, '') = '' AND coalesce(l.alt, '') = ''),
      non_descriptive_outlinks = (SELECT count(*) FROM links l JOIN urls d ON d.id = l.dst_id
        WHERE l.src_id = urls.id AND l.type = 'Hyperlink' AND d.is_internal = 1
        AND lower(trim(coalesce(l.anchor, ''))) IN (${anchors})),
      localhost_outlinks = (SELECT count(*) FROM links l JOIN urls d ON d.id = l.dst_id
        WHERE l.src_id = urls.id AND d.host IN (${localhosts}))
    WHERE kind = 'html' AND state = 3;
  `)
}

interface RedirectRow {
  id: number
  url: string
  redirect_url: string | null
}

function updateRedirectChains(db: DatabaseSync): void {
  const redirects = db
    .prepare("SELECT id, url, redirect_url FROM urls WHERE state = 3 AND redirect_url IS NOT NULL")
    .all() as unknown as RedirectRow[]
  const next = new Map(redirects.map((r) => [r.url, r.redirect_url as string]))
  const update = db.prepare('UPDATE urls SET redirect_chain_length = ?, redirect_loop = ?, final_url = ? WHERE id = ?')
  for (const r of redirects) {
    const seen = new Set([r.url])
    let current = r.redirect_url as string
    let hops = 1
    let loop = false
    while (next.has(current)) {
      if (seen.has(current)) {
        loop = true
        break
      }
      seen.add(current)
      current = next.get(current) as string
      hops += 1
    }
    if (!loop && seen.has(current)) loop = true
    update.run(hops, loop ? 1 : 0, loop ? null : current, r.id)
  }
}
