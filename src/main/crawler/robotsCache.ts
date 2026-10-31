import robotsParser from 'robots-parser'
import { fetchUrl, type FetchOptions } from './fetcher'

type Robots = ReturnType<typeof robotsParser>

export interface RobotsDecision {
  allowed: boolean
  matchedLine: string | null
}

export class RobotsCache {
  private readonly byOrigin = new Map<string, Promise<Robots | null>>()

  constructor(private readonly options: FetchOptions) {}

  async check(url: string): Promise<RobotsDecision> {
    const robots = await this.forOrigin(new URL(url).origin)
    if (!robots) return { allowed: true, matchedLine: null }
    const allowed = robots.isAllowed(url, this.options.userAgent) !== false
    const line = robots.getMatchingLineNumber(url, this.options.userAgent)
    return { allowed, matchedLine: line > 0 ? `line ${line}` : null }
  }

  async sitemaps(origin: string): Promise<string[]> {
    const robots = await this.forOrigin(origin)
    return robots ? robots.getSitemaps() : []
  }

  private forOrigin(origin: string): Promise<Robots | null> {
    let pending = this.byOrigin.get(origin)
    if (!pending) {
      pending = this.load(origin)
      this.byOrigin.set(origin, pending)
    }
    return pending
  }

  private async load(origin: string): Promise<Robots | null> {
    const robotsUrl = `${origin}/robots.txt`
    const res = await fetchUrl(robotsUrl, this.options)
    if (res.statusCode < 200 || res.statusCode > 299 || !res.body) return null
    return robotsParser(robotsUrl, res.body.toString('utf8'))
  }
}
