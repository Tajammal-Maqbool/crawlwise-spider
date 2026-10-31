import { safeStorage } from 'electron'
import type { SecretCodec } from '../interfaces/secretCodec'

export const electronSecretCodec: SecretCodec = {
  isAvailable: () => safeStorage.isEncryptionAvailable(),
  encrypt: (text) => safeStorage.encryptString(text),
  decrypt: (data) => safeStorage.decryptString(data)
}
