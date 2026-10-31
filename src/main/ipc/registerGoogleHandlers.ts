import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipcChannels'
import type { GoogleAuth } from '../services/googleAuth'
import { listSearchConsoleSites } from '../integrations/searchConsoleClient'
import { listAnalyticsProperties } from '../integrations/analyticsClient'

export function registerGoogleHandlers(google: GoogleAuth): void {
  ipcMain.handle(IPC.googleStatus, () => google.status())
  ipcMain.handle(IPC.googleConnect, (_e, clientId: string, clientSecret: string) => google.connect(clientId, clientSecret))
  ipcMain.handle(IPC.googleDisconnect, () => google.disconnect())
  ipcMain.handle(IPC.googleSites, () => listSearchConsoleSites(google))
  ipcMain.handle(IPC.googleProperties, () => listAnalyticsProperties(google))
}
