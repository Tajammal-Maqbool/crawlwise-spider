import robotsParser from 'robots-parser'
import type { FetchOptions } from './fetcher'
import { fetchWithRetry } from './fetchWithRetry'
import type { HostThrottle } from './hostThrottle'

type Robots = ReturnType<typeof robotsParser>

export interface RobotsDecision {
  allowed: boolean
  matchedLine: string | null
  crawlDelaySeconds: number | null
}

type OriginRobots = { kind: 'rules'; robots: Robots } | { kind: 'allow-all' } | { kind: 'unavailable'; status: number }

export class RobotsCache {
  private readonly byOrigin = new Map<string, Promise<OriginRobots>>()

  constructor(
    private readonly options: FetchOptions,
    private readonly throttle: HostThrottle,
    private readonly onUnavailable: (origin: string, status: number) => void = () => undefined
  ) {}

  async check(url: string): Promise<RobotsDecision> {
    const parsed = new URL(url)
    const entry = await this.forOrigin(parsed.origin)
    if (entry.kind === 'allow-all') return { allowed: true, matchedLine: null, crawlDelaySeconds: null }
    if (entry.kind === 'unavailable') {
      const isRobotsFile = parsed.pathname === '/robots.txt'
      return { allowed: isRobotsFile, matchedLine: isRobotsFile ? null : `robots.txt unavailable (HTTP ${entry.status})`, crawlDelaySeconds: null }
    }
    const { robots } = entry
    const allowed = robots.isAllowed(url, this.options.userAgent) !== false
    const line = robots.getMatchingLineNumber(url, this.options.userAgent)
    return { allowed, matchedLine: line > 0 ? `line ${line}` : null, crawlDelaySeconds: robots.getCrawlDelay(this.options.userAgent) ?? null }
  }

  async sitemaps(origin: string): Promise<string[]> {
    const entry = await this.forOrigin(origin)
    return entry.kind === 'rules' ? entry.robots.getSitemaps() : []
  }

  private forOrigin(origin: string): Promise<OriginRobots> {
    let pending = this.byOrigin.get(origin)
    if (!pending) {
      pending = this.load(origin)
      this.byOrigin.set(origin, pending)
    }
    return pending
  }

  private async load(origin: string): Promise<OriginRobots> {
    const robotsUrl = `${origin}/robots.txt`
    const res = await fetchWithRetry(robotsUrl, this.options, this.throttle)
    if (res.statusCode >= 200 && res.statusCode <= 299) {
      return res.body ? { kind: 'rules', robots: robotsParser(robotsUrl, res.body.toString('utf8')) } : { kind: 'allow-all' }
    }
    if (res.statusCode >= 400 && res.statusCode <= 499) return { kind: 'allow-all' }
    this.onUnavailable(origin, res.statusCode)
    return { kind: 'unavailable', status: res.statusCode }
  }
}
