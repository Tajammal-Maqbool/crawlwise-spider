import { cpSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function migrateUserData(appDataDir: string, newDir: string, oldNames: readonly string[]): string | null {
  if (existsSync(newDir) && readdirSync(newDir).length > 0) return null
  const source = oldNames.map((name) => join(appDataDir, name)).find((dir) => existsSync(dir) && dir !== newDir)
  if (!source) return null
  cpSync(source, newDir, { recursive: true })
  return source
}
