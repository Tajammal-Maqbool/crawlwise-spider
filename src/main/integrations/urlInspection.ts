import type { DatabaseSync } from 'node:sqlite'
import type { SearchConsoleOptions } from '@shared/interfaces/integrations'
import { INTERNAL_HTML_2XX } from '@shared/constants/filterRegistry/bases'
import { UrlRepository } from '../db/urlRepository'
import type { GoogleApiContext } from '../interfaces/googleApi'
import { runPool } from '../utils/runPool'
import { errorText } from '../utils/errorText'
import { GoogleApiError } from './googleApiError'
import { inspectUrl } from './searchConsoleClient'
import { inspectionFields } from './inspectionFields'

const CONCURRENCY = 2

export async function runUrlInspection(
  db: DatabaseSync,
  options: SearchConsoleOptions,
  google: GoogleApiContext,
  progress: (message: string) => void,
  stopped: () => boolean
): Promise<string[]> {
  if (!options.siteUrl.trim()) return []
  const rows = db
    .prepare(`SELECT id, url FROM urls WHERE ${INTERNAL_HTML_2XX('urls')} AND gsc_inspection_status IS NULL ORDER BY depth, id LIMIT ?`)
    .all(options.maxInspections) as Array<{ id: number; url: string }>
  const urls = new UrlRepository(db)
  let halt: string | null = null
  let done = 0
  await runPool(rows, CONCURRENCY, () => stopped() || halt !== null, async (row) => {
    try {
      urls.update(row.id, inspectionFields(await inspectUrl(google, options.siteUrl, row.url)))
    } catch (err) {
      if (!(err instanceof GoogleApiError)) halt = errorText(err)
      else if (err.status === 429) halt = 'daily quota reached, the other URLs were not inspected'
      else urls.update(row.id, { gsc_inspection_status: errorText(err, 200) })
    }
    done += 1
    progress(`URL Inspection ${done}/${rows.length}`)
  })
  return halt ? [`URL Inspection: ${halt}`] : []
}
