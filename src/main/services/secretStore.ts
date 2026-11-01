import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { SecretCodec } from '../interfaces/secretCodec'
import type { SecretsStatus, StoredSecrets } from '@shared/interfaces/storedSecrets'
import { EMPTY_SECRETS } from '@shared/constants/emptySecrets'
import { hasSecrets } from '@shared/utils/configSecrets'

export class SecretStore {
  private memory: StoredSecrets | null = null

  constructor(
    private readonly path: string,
    private readonly codec: SecretCodec
  ) {}

  read(): SecretsStatus {
    if (!this.codec.isAvailable()) return { secrets: this.memory ?? { ...EMPTY_SECRETS }, persistent: false }
    if (!existsSync(this.path)) return { secrets: { ...EMPTY_SECRETS }, persistent: true }
    try {
      const parsed = JSON.parse(this.codec.decrypt(readFileSync(this.path))) as Partial<StoredSecrets>
      return { secrets: { ...EMPTY_SECRETS, ...parsed }, persistent: true }
    } catch {
      return { secrets: { ...EMPTY_SECRETS }, persistent: true }
    }
  }

  write(secrets: StoredSecrets): SecretsStatus {
    const clean = { pagespeedApiKey: String(secrets.pagespeedApiKey ?? ''), aiApiKey: String(secrets.aiApiKey ?? '') }
    if (!this.codec.isAvailable()) {
      this.memory = clean
      return { secrets: clean, persistent: false }
    }
    if (!hasSecrets(clean)) {
      rmSync(this.path, { force: true })
      return { secrets: clean, persistent: true }
    }
    mkdirSync(dirname(this.path), { recursive: true })
    writeFileSync(this.path, this.codec.encrypt(JSON.stringify(clean)))
    return { secrets: clean, persistent: true }
  }
}
