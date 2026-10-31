import type { DatabaseSync } from 'node:sqlite'

export function inTransaction(db: DatabaseSync, work: () => void): void {
  db.exec('BEGIN')
  try {
    work()
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}
