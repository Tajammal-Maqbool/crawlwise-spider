import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { LinkType } from '@shared/types/linkType'

export interface LinkCandidate {
  type: LinkType
  follow: boolean
  isInternal: boolean
  depth: number
  urlLength: number
}

export function shouldFetch(config: CrawlConfig, link: LinkCandidate): boolean {
  if (config.mode === 'list') return link.type === 'XML Sitemap' && link.isInternal
  if (link.urlLength > config.limits.maxUrlLength) return false
  const r = config.resources
  const externalOk = r.checkExternalLinks
  const reach = (allowed: boolean) => allowed && (link.isInternal || externalOk)
  switch (link.type) {
    case 'Hyperlink':
    case 'Iframe':
      if (config.limits.maxDepth >= 0 && link.depth > config.limits.maxDepth) return false
      return link.isInternal
        ? link.follow || r.followInternalNofollow
        : externalOk && (link.follow || r.followExternalNofollow)
    case 'Image':
      return reach(r.checkImages)
    case 'CSS':
      return reach(r.checkCss)
    case 'JavaScript':
      return reach(r.checkJavaScript)
    case 'Media':
    case 'Font':
      return reach(r.checkMedia)
    case 'Canonical':
    case 'HTTP Canonical':
      return reach(r.crawlCanonicals)
    case 'Rel Next':
    case 'Rel Prev':
      return reach(r.crawlPagination)
    case 'Hreflang':
      return reach(r.crawlHreflang)
    case 'HTTP Redirect':
    case 'Meta Refresh':
    case 'XML Sitemap':
      return reach(true)
    case 'AMPHTML':
      return link.isInternal
    default:
      return false
  }
}
