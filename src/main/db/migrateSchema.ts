import type { DatabaseSync } from 'node:sqlite'
import { SCHEMA_SQL } from './schema'

export function addMissingColumns(db: DatabaseSync, table: string): void {
  const block = new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \(([\s\S]*?)\n\);`).exec(SCHEMA_SQL)?.[1]
  if (!block) return
  const existing = new Set((db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((c) => c.name))
  for (const line of block.split('\n')) {
    const match = /^\s+([a-z_0-9]+) ([A-Z]+.*?),?$/.exec(line)
    if (!match || existing.has(match[1]) || /PRIMARY KEY/.test(match[2])) continue
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${match[1]} ${match[2].replace(/,$/, '')}`)
  }
}
