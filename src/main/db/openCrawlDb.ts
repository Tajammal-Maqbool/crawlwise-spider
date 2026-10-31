import { DatabaseSync } from 'node:sqlite'
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema'
import { addMissingColumns } from './migrateSchema'

export function openCrawlDb(filePath: string, readOnly = false): DatabaseSync {
  const db = new DatabaseSync(filePath, { readOnly })
  db.exec('PRAGMA busy_timeout = 5000;')
  if (readOnly) return db
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = OFF;')
  db.exec(SCHEMA_SQL)
  addMissingColumns(db, 'urls')
  db.prepare('INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('schema_version', String(SCHEMA_VERSION))
  return db
}
