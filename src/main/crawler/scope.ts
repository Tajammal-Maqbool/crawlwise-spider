import type { CrawlConfig } from '@shared/interfaces/crawlConfig'

export class CrawlScope {
  private readonly startHost: string
  private readonly startFolder: string
  private readonly include: RegExp[]
  private readonly exclude: RegExp[]

  constructor(private readonly config: CrawlConfig, startUrl: string) {
    const parsed = new URL(startUrl)
    this.startHost = parsed.hostname
    this.startFolder = parsed.pathname.endsWith('/') ? parsed.pathname : parsed.pathname.replace(/[^/]*$/, '')
    this.include = compilePatterns(config.includePatterns)
    this.exclude = compilePatterns(config.excludePatterns)
  }

  get host(): string {
    return this.startHost
  }

  isInternal(url: string): boolean {
    const host = new URL(url).hostname
    if (host === this.startHost) return true
    if (!this.config.resources.crawlAllSubdomains) return false
    return host.endsWith(`.${rootDomain(this.startHost)}`) || host === rootDomain(this.startHost)
  }

  isAllowedByRules(url: string): boolean {
    if (this.exclude.some((r) => r.test(url))) return false
    if (this.include.length > 0 && !this.include.some((r) => r.test(url))) return false
    if (!this.config.resources.crawlOutsideStartFolder && this.isInternal(url)) {
      return new URL(url).pathname.startsWith(this.startFolder)
    }
    return true
  }
}

function compilePatterns(patterns: string[]): RegExp[] {
  const compiled: RegExp[] = []
  for (const p of patterns) {
    try {
      compiled.push(new RegExp(p))
    } catch {
      continue
    }
  }
  return compiled
}

function rootDomain(host: string): string {
  const parts = host.split('.')
  return parts.length <= 2 ? host : parts.slice(-2).join('.')
}
