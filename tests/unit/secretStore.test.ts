import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SecretStore } from '../../src/main/services/secretStore'
import { plainSecretCodec } from '../fixtures/plainSecretCodec'
import type { SecretCodec } from '../../src/main/interfaces/secretCodec'

const unavailable: SecretCodec = { ...plainSecretCodec, isAvailable: () => false }
const secrets = { pagespeedApiKey: 'psi-123', aiApiKey: 'sk-ant-456' }

function tempPath(): string {
  return join(mkdtempSync(join(tmpdir(), 'secrets-')), 'sub', 'secrets.bin')
}

describe('SecretStore', () => {
  it('returns empty secrets when nothing is stored', () => {
    expect(new SecretStore(tempPath(), plainSecretCodec).read()).toEqual({
      secrets: { pagespeedApiKey: '', aiApiKey: '' },
      persistent: true
    })
  })

  it('writes an encrypted file and reads it back', () => {
    const path = tempPath()
    new SecretStore(path, plainSecretCodec).write(secrets)
    expect(readFileSync(path).toString('utf8')).not.toContain('psi-123')
    expect(new SecretStore(path, plainSecretCodec).read().secrets).toEqual(secrets)
  })

  it('keeps secrets in memory only when encryption is unavailable', () => {
    const path = tempPath()
    const store = new SecretStore(path, unavailable)
    expect(store.write(secrets)).toEqual({ secrets, persistent: false })
    expect(existsSync(path)).toBe(false)
    expect(store.read()).toEqual({ secrets, persistent: false })
    expect(new SecretStore(path, unavailable).read().secrets).toEqual({ pagespeedApiKey: '', aiApiKey: '' })
  })

  it('removes the file when all secrets are empty', () => {
    const path = tempPath()
    const store = new SecretStore(path, plainSecretCodec)
    store.write(secrets)
    store.write({ pagespeedApiKey: '', aiApiKey: '' })
    expect(existsSync(path)).toBe(false)
  })
})
