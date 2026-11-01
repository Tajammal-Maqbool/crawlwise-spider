import { Worker } from 'node:worker_threads'
import { join } from 'node:path'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { CrawlProgress } from '@shared/interfaces/crawlProgress'
import type { CrawlWorkerData, WorkerCommand, WorkerEvent } from '../interfaces/workerMessages'
import type { CrawlLibrary } from './crawlLibrary'
import type { RenderPool } from './renderPool'
import type { GoogleApiContext } from '../interfaces/googleApi'
import { errorText } from '../utils/errorText'

export class CrawlManager {
  private worker: Worker | null = null
  private activeId: string | null = null

  constructor(
    private readonly library: CrawlLibrary,
    private readonly onProgress: (progress: CrawlProgress) => void,
    private readonly renderPool: RenderPool,
    private readonly setRenderWindows: (count: number) => void,
    private readonly google: GoogleApiContext
  ) {
    this.library.setLiveCheck((id) => this.isActive(id))
  }

  start(config: CrawlConfig): string {
    this.ensureIdle()
    const id = this.library.create(config)
    this.spawn({ crawlId: id, dbPath: this.library.pathOf(id), config, resume: false, googleEndpoints: this.google.endpoints })
    return id
  }

  continue(id: string): void {
    this.ensureIdle()
    this.spawn({ crawlId: id, dbPath: this.library.pathOf(id), config: this.library.config(id), resume: true, googleEndpoints: this.google.endpoints })
  }

  pause(): void {
    this.send({ type: 'pause' })
  }

  resume(): void {
    this.send({ type: 'resume' })
  }

  stop(): void {
    this.send({ type: 'stop' })
  }

  isActive(id: string): boolean {
    return this.activeId === id
  }

  async shutdown(): Promise<void> {
    if (!this.worker) return
    this.stop()
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        void this.worker?.terminate()
        resolve()
      }, 5000)
      this.worker?.once('exit', () => {
        clearTimeout(timer)
        resolve()
      })
    })
  }

  private spawn(data: CrawlWorkerData): void {
    this.setRenderWindows(data.config.rendering.maxWindows)
    const worker = new Worker(join(__dirname, 'crawlWorker.js'), { workerData: data })
    this.worker = worker
    this.activeId = data.crawlId
    worker.on('message', (event: WorkerEvent) => {
      if (event.type === 'progress' || event.type === 'finished') this.onProgress(event.progress)
      if ((event.type === 'finished' || event.type === 'error') && this.worker === worker) {
        this.worker = null
        this.activeId = null
      }
      if (event.type === 'error') this.onProgress(failedProgress(data.crawlId, event.message))
      if (event.type === 'render') {
        void this.renderPool
          .render(event.url, data.config.userAgent, data.config.rendering.timeoutMs, data.config.rendering.accessibility, data.config.rendering.screenshots)
          .then((result) => worker.postMessage({ type: 'rendered', requestId: event.requestId, result } satisfies WorkerCommand))
      }
      if (event.type === 'google-token') {
        const reply = (token: string | null, error: string | null) =>
          worker.postMessage({ type: 'google-token', requestId: event.requestId, token, error } satisfies WorkerCommand)
        this.google.accessToken().then((token) => reply(token, null), (err: unknown) => reply(null, errorText(err)))
      }
    })
    worker.on('error', (err: Error) => this.onProgress(failedProgress(data.crawlId, err.message)))
    worker.on('exit', () => {
      if (this.worker === worker) {
        this.worker = null
        this.activeId = null
      }
    })
  }

  private send(command: WorkerCommand): void {
    this.worker?.postMessage(command)
  }

  private ensureIdle(): void {
    if (this.worker) throw new Error('A crawl is already running. Stop it first.')
  }
}

function failedProgress(crawlId: string, message: string): CrawlProgress {
  return { crawlId, state: 'failed', crawled: 0, queued: 0, discovered: 0, urlsPerSecond: 0, activeThreads: 0, dbSizeBytes: 0, message }
}
