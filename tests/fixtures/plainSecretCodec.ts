import type { SecretCodec } from '../../src/main/interfaces/secretCodec'

export const plainSecretCodec: SecretCodec = {
  isAvailable: () => true,
  encrypt: (text) => Buffer.from(text, 'utf8').reverse(),
  decrypt: (data) => Buffer.from(data).reverse().toString('utf8')
}
