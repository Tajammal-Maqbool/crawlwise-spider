import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { migrateUserData } from '../../src/main/services/migrateUserData'

let root = ''
afterEach(() => root && rmSync(root, { recursive: true, force: true }))

function setup(): string {
  root = mkdtempSync(join(tmpdir(), 'migrate-'))
  return root
}

describe('migrateUserData', () => {
  it('copies the first legacy folder when the new folder is missing', () => {
    const appData = setup()
    mkdirSync(join(appData, 'Old', 'crawls'), { recursive: true })
    writeFileSync(join(appData, 'Old', 'crawls', 'a.db'), 'data')
    const target = join(appData, 'New')
    expect(migrateUserData(appData, target, ['Old', 'Older'])).toBe(join(appData, 'Old'))
    expect(readFileSync(join(target, 'crawls', 'a.db'), 'utf8')).toBe('data')
    expect(existsSync(join(appData, 'Old', 'crawls', 'a.db'))).toBe(true)
  })
  it('copies into an empty new folder', () => {
    const appData = setup()
    mkdirSync(join(appData, 'New'))
    mkdirSync(join(appData, 'Older'))
    writeFileSync(join(appData, 'Older', 'x.txt'), '1')
    expect(migrateUserData(appData, join(appData, 'New'), ['Old', 'Older'])).toBe(join(appData, 'Older'))
    expect(existsSync(join(appData, 'New', 'x.txt'))).toBe(true)
  })
  it('does nothing when the new folder has data', () => {
    const appData = setup()
    mkdirSync(join(appData, 'New'))
    writeFileSync(join(appData, 'New', 'keep.txt'), 'k')
    mkdirSync(join(appData, 'Old'))
    writeFileSync(join(appData, 'Old', 'x.txt'), '1')
    expect(migrateUserData(appData, join(appData, 'New'), ['Old'])).toBeNull()
    expect(existsSync(join(appData, 'New', 'x.txt'))).toBe(false)
  })
  it('does nothing when no legacy folder exists', () => {
    const appData = setup()
    expect(migrateUserData(appData, join(appData, 'New'), ['Old'])).toBeNull()
    expect(existsSync(join(appData, 'New'))).toBe(false)
  })
})
