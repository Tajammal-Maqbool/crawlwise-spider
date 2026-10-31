import type { DatabaseSync } from 'node:sqlite'
import type { DepthBucket, FolderNode, SiteStructure } from '@shared/interfaces/siteStructure'

const PAGES = "state = 3 AND is_internal = 1 AND kind = 'html'"
const MAX_FOLDERS = 200

export function getSiteStructure(db: DatabaseSync): SiteStructure {
  const depths = db.prepare(`SELECT depth, count(*) AS count FROM urls WHERE ${PAGES} AND depth IS NOT NULL GROUP BY depth ORDER BY depth`).all() as unknown as DepthBucket[]
  const urls = db.prepare(`SELECT url FROM urls WHERE ${PAGES}`).all() as Array<{ url: string }>
  const counts = new Map<string, number>()
  for (const { url } of urls) {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    let path = ''
    for (const seg of segments.slice(0, Math.max(segments.length - 1, 0)).slice(0, 3)) {
      path += `/${seg}`
      counts.set(`${path}/`, (counts.get(`${path}/`) ?? 0) + 1)
    }
    counts.set('/', (counts.get('/') ?? 0) + 1)
  }
  const folders: FolderNode[] = [...counts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => a.path.localeCompare(b.path))
    .slice(0, MAX_FOLDERS)
  return { depths, folders }
}
