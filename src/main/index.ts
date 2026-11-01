import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { IPC } from '@shared/constants/ipcChannels'
import { CrawlLibrary } from './services/crawlLibrary'
import { CrawlManager } from './services/crawlManager'
import { RenderPool } from './services/renderPool'
import { Scheduler } from './services/scheduler'
import { registerHandlers } from './ipc/registerHandlers'
import { registerGoogleHandlers } from './ipc/registerGoogleHandlers'
import { GoogleAuth } from './services/googleAuth'
import { GoogleAccountStore } from './services/googleAccountStore'
import { electronSecretCodec } from './services/electronSecretCodec'
import { googleEndpointsFor } from './utils/googleEndpointsFor'
import { GOOGLE_API_BASE_ENV } from './constants/google'
import { APP_NAME } from '@shared/constants/appInfo'
import { LEGACY_APP_NAMES } from './constants/legacyAppNames'
import { migrateUserData } from './services/migrateUserData'
import { isAppUrl } from './utils/isAppUrl'

let mainWindow: BrowserWindow | null = null

app.setName(APP_NAME)
const userDataArg = process.argv.find((a) => a.startsWith('--user-data-dir='))
if (userDataArg) app.setPath('userData', userDataArg.slice('--user-data-dir='.length))
else {
  try {
    migrateUserData(app.getPath('appData'), app.getPath('userData'), LEGACY_APP_NAMES)
  } catch (err) {
    console.error('User data migration failed', err)
  }
}

// Requested after the userData path is final: the lock is scoped to that folder, so e2e runs with their own --user-data-dir do not collide.
if (!app.requestSingleInstanceLock()) app.quit()
app.on('second-instance', () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.focus()
})

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: APP_NAME,
    icon: join(__dirname, '../../resources/icon.png'),
    backgroundColor: '#1b1d22',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  window.removeMenu()
  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  const rendererFile = join(__dirname, '../renderer/index.html')
  const appUrl = process.env.ELECTRON_RENDERER_URL ?? pathToFileURL(rendererFile).href
  window.webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url, appUrl)) return
    event.preventDefault()
    if (/^https?:/.test(url)) void shell.openExternal(url)
  })
  if (process.env.ELECTRON_RENDERER_URL) void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void window.loadFile(rendererFile)
  return window
}

app.whenReady().then(() => {
  const library = new CrawlLibrary(join(app.getPath('userData'), 'crawls'))
  let renderWindows = 2
  const renderPool = new RenderPool(() => renderWindows)
  const googleStore = new GoogleAccountStore(join(app.getPath('userData'), 'google-account.bin'), electronSecretCodec)
  const google = new GoogleAuth(googleStore, googleEndpointsFor(process.env[GOOGLE_API_BASE_ENV]), (url) => shell.openExternal(url))
  const manager = new CrawlManager(library, (progress) => mainWindow?.webContents.send(IPC.crawlProgress, progress), renderPool, (n) => (renderWindows = n), google)
  const scheduler = new Scheduler(join(app.getPath('userData'), 'schedules'), process.execPath, join(__dirname, 'cli.js'))
  registerHandlers(library, manager, scheduler)
  registerGoogleHandlers(google)
  mainWindow = createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })

  let quitting = false
  app.on('before-quit', (event) => {
    if (quitting) return
    event.preventDefault()
    quitting = true
    void manager.shutdown().finally(() => {
      library.closeAll()
      app.quit()
    })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
