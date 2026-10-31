import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { SecretCodec } from '../interfaces/secretCodec'
import type { StoredGoogleAccount } from '../interfaces/googleTokens'

export class GoogleAccountStore {
  constructor(
    private readonly path: string,
    private readonly codec: SecretCodec
  ) {}

  read(): StoredGoogleAccount | null {
    if (!existsSync(this.path) || !this.codec.isAvailable()) return null
    try {
      return JSON.parse(this.codec.decrypt(readFileSync(this.path))) as StoredGoogleAccount
    } catch {
      return null
    }
  }

  write(account: StoredGoogleAccount): void {
    if (!this.codec.isAvailable()) throw new Error('Secure storage is not available on this computer, so the Google account cannot be saved.')
    mkdirSync(dirname(this.path), { recursive: true })
    writeFileSync(this.path, this.codec.encrypt(JSON.stringify(account)))
  }

  clear(): void {
    rmSync(this.path, { force: true })
  }
}
