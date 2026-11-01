import type { DatabaseSync } from 'node:sqlite'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { CrawlProgress } from '@shared/interfaces/crawlProgress'
import type { CrawlState } from '@shared/types/crawlState'
import { normalizeUrl } from '@shared/utils/normalizeUrl'
import { kindFromExtension } from '@shared/utils/urlKind'
import { UrlRepository, type QueuedUrl } from '../db/urlRepository'
import { LinkRepository } from '../db/linkRepository'
import { PageStore } from '../db/pageStore'
import { readMeta, writeMeta } from '../db/metaRepository'
import type { ExtractedLink } from '../interfaces/parsedPage'
import type { FetchOptions } from './fetcher'
import { fetchWithRetry } from './fetchWithRetry'
import { HostThrottle } from './hostThrottle'
import { RobotsCache } from './robotsCache'
import { CrawlScope } from './scope'
import { processPage } from './pageProcessor'
import { shouldFetch } from './linkPolicy'
import { runPostCrawlAnalysis } from './postCrawlAnalysis'
import { ProgressMeter } from './progressMeter'
import { effectiveDelayMs } from '../utils/effectiveDelayMs'
import { resolveKind } from './responseFields'
import type { PageRenderer } from '../interfaces/renderResult'
import { runEnrichment } from '../integrations/enrichment'
import { importGoogleData, markMissingGoogleData } from '../integrations/googleImport'
import type { GoogleApiContext } from '../interfaces/googleApi'

const PROGRESS_INTERVAL_MS = 500
const SAME_LEVEL_TYPES = new Set(['HTTP Redirect', 'Meta Refresh', 'Canonical', 'HTTP Canonical'])

export type ProgressListener = (progress: CrawlProgress) => void

export class CrawlEngine {
  private readonly urls: UrlRepository
  private readonly links: LinkRepository
  private readonly store: PageStore
  private readonly robots: RobotsCache
  private readonly scope: CrawlScope
  private readonly fetchOptions: FetchOptions
  private readonly throttle = new HostThrottle()
  private readonly meter = new ProgressMeter()
  private state: CrawlState = 'idle'
  private inFlight = 0
  private wake: (() => void) | null = null
  private lastDispatch = 0
  private message: string | null = null
  private readonly warnings: string[] = []

  constructor(
    private readonly db: DatabaseSync,
    private readonly config: CrawlConfig,
    private readonly crawlId: string,
    private readonly onProgress: ProgressListener,
    private readonly fileSize: () => number,
    private readonly renderer: PageRenderer | null = null,
    private readonly google: GoogleApiContext | null = null
  ) {
    this.urls = new UrlRepository(db)
    this.links = new LinkRepository(db)
    this.store = new PageStore(db, this.urls, this.links)
    this.fetchOptions = {
      userAgent: config.userAgent,
      timeoutMs: config.responseTimeoutMs,
      maxBytes: config.limits.maxPageSizeKb * 1024,
      extraHeaders: config.extraHeaders
    }
    this.robots = new RobotsCache(this.fetchOptions, this.throttle, (origin, status) => this.warnRobotsUnavailable(origin, status))
    this.scope = new CrawlScope(config, this.seedUrls()[0] ?? 'http://invalid.local/')
  }

  async run(resume: boolean): Promise<CrawlProgress> {
    const timer = setInterval(() => this.emit(), PROGRESS_INTERVAL_MS)
    try {
      if (resume) this.urls.requeueInProgress()
      else await this.seed()
      this.meter.start(this.urls.counts().crawled)
      this.setState('crawling')
      await this.importGoogle()
      await this.loop()
      while (this.inFlight > 0) await this.nextEvent()
      if (this.state !== 'stopped') {
        this.setState('analysing')
        this.emit()
        markMissingGoogleData(this.db)
        this.warnings.push(...(await runEnrichment(this.db, this.config, this.google, (m) => (this.message = m || null), () => this.state === 'stopped')))
        runPostCrawlAnalysis(this.db, this.scope.host, this.config)
        if (!this.wasStopped()) this.setState('completed')
        this.message = this.warnings.length > 0 ? this.warnings.join(' | ') : null
      } else {
        runPostCrawlAnalysis(this.db, this.scope.host, this.config)
      }
    } catch (err) {
      this.message = err instanceof Error ? err.message : String(err)
      this.setState('failed')
    } finally {
      clearInterval(timer)
    }
    return this.snapshot()
  }

  pause(): void {
    if (this.state !== 'crawling') return
    this.setState('paused')
    this.notify()
  }

  resume(): void {
    if (this.state !== 'paused') return
    this.setState('crawling')
    this.notify()
  }

  stop(): void {
    this.setState('stopped')
    this.notify()
  }

  private async loop(): Promise<void> {
    for (;;) {
      if (this.state === 'stopped') return
      if (this.state === 'paused') {
        if (this.inFlight === 0) runPostCrawlAnalysis(this.db, this.scope.host, this.config)
        await this.nextEvent()
        continue
      }
      const capacity = this.config.speed.maxThreads - this.inFlight
      const batch = capacity > 0 && !this.limitReached() ? this.urls.takeBatch(this.rateLimited(capacity)) : []
      for (const q of batch) this.dispatch(q)
      if (this.inFlight === 0 && batch.length === 0) return
      await this.nextEvent(this.config.speed.maxUrlsPerSecond > 0 ? 1000 / this.config.speed.maxUrlsPerSecond : undefined)
    }
  }

  private dispatch(q: QueuedUrl): void {
    this.inFlight += 1
    this.lastDispatch = Date.now()
    this.process(q)
      .catch((err) => this.markFailed(q, err))
      .finally(() => {
        this.inFlight -= 1
        this.notify()
      })
  }

  private async process(q: QueuedUrl): Promise<void> {
    if (this.config.respectRobotsTxt) {
      const decision = await this.robots.check(q.url)
      if (decision.crawlDelaySeconds !== null) {
        this.throttle.setMinInterval(new URL(q.url).host, effectiveDelayMs(this.config.speed.maxUrlsPerSecond, decision.crawlDelaySeconds))
      }
      if (!decision.allowed) {
        this.urls.update(q.id, {
          state: 3,
          status_code: 0,
          status_text: 'Blocked by robots.txt',
          blocked_by_robots: 1,
          robots_line: decision.matchedLine,
          kind: kindFromExtension(q.url) ?? 'unknown',
          indexability: 'Non-Indexable',
          indexability_status: 'Blocked by robots.txt',
          crawl_timestamp: new Date().toISOString()
        })
        return
      }
    }
    const result = await fetchWithRetry(q.url, this.fetchOptions, this.throttle)
    const page = processPage(q.url, q.isInternal, result, this.config, await this.renderIfNeeded(q, result))
    this.store.save(q.id, page, (link) => this.discoverLink(q, link))
  }

  private async renderIfNeeded(q: QueuedUrl, result: Awaited<ReturnType<typeof fetchWithRetry>>) {
    if (this.config.rendering.mode !== 'javascript' || !this.renderer || !q.isInternal) return null
    if (result.statusCode < 200 || result.statusCode > 299 || resolveKind(q.url, result) !== 'html') return null
    return this.renderer.render(q.url)
  }

  private discoverLink(src: QueuedUrl, link: ExtractedLink): number {
    const isInternal = this.scope.isInternal(link.url)
    const depth = SAME_LEVEL_TYPES.has(link.type) ? src.depth : src.depth + 1
    const ref = this.urls.discover(link.url, isInternal, depth, link.type)
    this.links.addLink(src.id, ref.id, link)
    if (ref.state === 0 && this.scope.isAllowedByRules(link.url)) {
      if (shouldFetch(this.config, { type: link.type, follow: link.follow, isInternal, depth, urlLength: link.url.length })) {
        this.urls.enqueue(ref.id)
      }
    }
    return ref.id
  }

  private async importGoogle(): Promise<void> {
    const { searchConsole, analytics } = this.config.integrations
    if ((!searchConsole.enabled && !analytics.enabled) || readMeta(this.db, 'google_import') === 'done') return
    if (!this.google) this.warnings.push('Search Console and GA4 run only in the desktop app, so they were skipped')
    else {
      const resolve = (url: string, via: string, crawl: boolean) => this.resolveIntegrationUrl(url, via, crawl)
      const warnings = await importGoogleData(this.db, this.config, this.google, this.seedUrls()[0] ?? '', resolve, (m) => (this.message = m || null))
      this.warnings.push(...warnings)
    }
    writeMeta(this.db, 'google_import', 'done')
  }

  private resolveIntegrationUrl(url: string, foundVia: string, crawl: boolean): number | null {
    if (!this.scope.isInternal(url)) return null
    const ref = this.urls.discover(url, true, 1, foundVia)
    if (crawl && ref.state === 0 && this.scope.isAllowedByRules(url)) this.urls.enqueue(ref.id)
    return ref.id
  }

  private async seed(): Promise<void> {
    const seeds = this.seedUrls()
    for (const url of seeds) this.urls.enqueue(this.urls.discover(url, true, 0, 'Seed').id)
    const sitemaps = [...this.config.sitemaps.sitemapUrls]
    if (this.config.mode === 'spider' && this.config.sitemaps.crawlLinkedSitemaps && seeds[0]) {
      sitemaps.push(...(await this.robots.sitemaps(new URL(seeds[0]).origin)))
    }
    for (const raw of sitemaps) {
      const url = normalizeUrl(raw)
      if (url) this.urls.enqueue(this.urls.discover(url, this.scope.isInternal(url), 1, 'XML Sitemap').id)
    }
  }

  private seedUrls(): string[] {
    const raw = this.config.mode === 'list' ? this.config.listUrls : [this.config.startUrl]
    return [...new Set(raw.map((u) => normalizeUrl(u)).filter((u): u is string => !!u))]
  }

  private markFailed(q: QueuedUrl, err: unknown): void {
    try {
      this.urls.update(q.id, {
        state: 3,
        status_code: 0,
        status_text: 'Processing Error',
        error: err instanceof Error ? err.message : String(err),
        indexability: 'Non-Indexable',
        indexability_status: 'No Response'
      })
    } catch {
      this.message = 'Could not record a failed URL'
    }
  }

  private limitReached(): boolean {
    return this.urls.counts().crawled + this.inFlight >= this.config.limits.maxUrls
  }

  private rateLimited(capacity: number): number {
    const perSecond = this.config.speed.maxUrlsPerSecond
    if (perSecond <= 0) return capacity
    return Date.now() - this.lastDispatch >= 1000 / perSecond ? 1 : 0
  }

  private nextEvent(timeoutMs?: number): Promise<void> {
    return new Promise((resolve) => {
      this.wake = resolve
      if (timeoutMs !== undefined) setTimeout(resolve, timeoutMs)
    })
  }

  private notify(): void {
    const wake = this.wake
    this.wake = null
    wake?.()
  }

  private wasStopped(): boolean {
    return this.state === 'stopped'
  }

  private warnRobotsUnavailable(origin: string, status: number): void {
    const warning = `robots.txt for ${origin} could not be fetched (${status === 0 ? 'network error' : `HTTP ${status}`}), so the host is treated as disallowed`
    this.warnings.push(warning)
    this.message = warning
  }

  private setState(state: CrawlState): void {
    this.state = state
    this.meter.setActive(state === 'crawling')
    writeMeta(this.db, 'state', state)
  }

  private snapshot(): CrawlProgress {
    const counts = this.urls.counts()
    return {
      crawlId: this.crawlId,
      state: this.state,
      ...counts,
      urlsPerSecond: this.meter.average(counts.crawled),
      activeThreads: this.inFlight,
      dbSizeBytes: this.fileSize(),
      message: this.message
    }
  }

  private emit(): void {
    this.onProgress(this.snapshot())
  }
}
