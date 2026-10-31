import { BrowserWindow, session, type Session } from 'electron'
import type { RenderResult } from '../interfaces/renderResult'
import { runAxe } from './axeRunner'

const PARTITION = 'render'
const IDLE_MS = 500
const POLL_MS = 100
const MAX_MESSAGE_CHARS = 300

interface PageState {
  inflight: number
  lastActivity: number
  failed: string[]
}

export class RenderPool {
  private readonly ses: Session
  private readonly states = new Map<number, PageState>()
  private active = 0
  private readonly waiting: Array<() => void> = []

  constructor(private readonly maxWindows: () => number) {
    this.ses = session.fromPartition(PARTITION)
    this.ses.on('will-download', (_e, item) => item.cancel())
    this.ses.webRequest.onBeforeRequest((details, callback) => {
      const state = details.webContentsId !== undefined ? this.states.get(details.webContentsId) : undefined
      if (state) {
        state.inflight += 1
        state.lastActivity = Date.now()
      }
      callback({})
    })
    this.ses.webRequest.onCompleted((details) => {
      const state = this.stateOf(details.webContentsId)
      if (!state) return
      state.inflight = Math.max(0, state.inflight - 1)
      state.lastActivity = Date.now()
      if (details.resourceType !== 'mainFrame' && details.statusCode >= 400) state.failed.push(details.url)
    })
    this.ses.webRequest.onErrorOccurred((details) => {
      const state = this.stateOf(details.webContentsId)
      if (!state) return
      state.inflight = Math.max(0, state.inflight - 1)
      state.lastActivity = Date.now()
      if (details.resourceType !== 'mainFrame') state.failed.push(details.url)
    })
  }

  async render(url: string, userAgent: string, timeoutMs: number, accessibility = false, screenshot = false): Promise<RenderResult | null> {
    await this.acquire()
    try {
      return await this.renderOne(url, userAgent, timeoutMs, accessibility, screenshot)
    } catch {
      return null
    } finally {
      this.release()
    }
  }

  private async renderOne(url: string, userAgent: string, timeoutMs: number, accessibility: boolean, screenshot: boolean): Promise<RenderResult | null> {
    const win = new BrowserWindow({
      show: false,
      width: 1366,
      height: 768,
      webPreferences: { partition: PARTITION, offscreen: true, sandbox: true, contextIsolation: true, nodeIntegration: false }
    })
    const id = win.webContents.id
    const state: PageState = { inflight: 0, lastActivity: Date.now(), failed: [] }
    const errors: string[] = []
    const warnings: string[] = []
    this.states.set(id, state)
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    win.webContents.setAudioMuted(true)
    win.webContents.on('console-message', (...args: unknown[]) => {
      const { level, message } = consoleDetails(args)
      if (level === 'error') errors.push(message.slice(0, MAX_MESSAGE_CHARS))
      else if (level === 'warning') warnings.push(message.slice(0, MAX_MESSAGE_CHARS))
    })
    let loaded = false
    win.webContents.on('will-navigate', (event) => {
      if (loaded) event.preventDefault()
    })
    win.webContents.on('will-frame-navigate', (event) => {
      if (loaded && event.isMainFrame) event.preventDefault()
    })
    const deadline = Date.now() + timeoutMs
    try {
      await Promise.race([win.loadURL(url, { userAgent }), sleep(timeoutMs)]).catch(() => undefined)
      loaded = true
      while (Date.now() < deadline) {
        if (state.inflight === 0 && Date.now() - state.lastActivity >= IDLE_MS) break
        await sleep(POLL_MS)
      }
      const html = (await win.webContents.executeJavaScript('document.documentElement.outerHTML', true)) as string
      const violations = accessibility ? await runAxe(win.webContents) : null
      const png = screenshot ? await win.webContents.capturePage().then((image) => image.toPNG(), () => null) : null
      return { html: `<!doctype html>${html}`, errors, warnings, failedResources: [...new Set(state.failed)], accessibility: violations, screenshot: png }
    } finally {
      this.states.delete(id)
      win.destroy()
    }
  }

  private stateOf(webContentsId: number | undefined): PageState | undefined {
    return webContentsId === undefined ? undefined : this.states.get(webContentsId)
  }

  private acquire(): Promise<void> {
    if (this.active < Math.max(1, this.maxWindows())) {
      this.active += 1
      return Promise.resolve()
    }
    return new Promise((resolve) => this.waiting.push(() => resolve()))
  }

  private release(): void {
    const next = this.waiting.shift()
    if (next) next()
    else this.active -= 1
  }
}

function consoleDetails(args: unknown[]): { level: string; message: string } {
  const event = args[0] as { level?: unknown; message?: unknown }
  if (typeof event?.level === 'string') return { level: event.level, message: String(event.message ?? '') }
  const numeric = Number(args[1])
  const level = numeric >= 3 ? 'error' : numeric === 2 ? 'warning' : 'info'
  return { level, message: String(args[2] ?? '') }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
