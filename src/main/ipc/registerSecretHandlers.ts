import { app, ipcMain } from 'electron'
import { join } from 'node:path'
import { IPC } from '@shared/constants/ipcChannels'
import type { StoredSecrets } from '@shared/interfaces/storedSecrets'
import { SecretStore } from '../services/secretStore'
import { electronSecretCodec } from '../services/electronSecretCodec'

export function registerSecretHandlers(): void {
  const store = new SecretStore(join(app.getPath('userData'), 'api-keys.bin'), electronSecretCodec)
  ipcMain.handle(IPC.secretsGet, () => store.read())
  ipcMain.handle(IPC.secretsSave, (_e, secrets: StoredSecrets) => store.write(secrets))
}
