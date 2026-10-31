import type { LinkType } from '@shared/types/linkType'
import type { PathType } from '@shared/utils/pathType'

export interface ExtractedLink {
  url: string
  rawHref: string
  type: LinkType
  anchor: string | null
  alt: string | null
  rel: string | null
  follow: boolean
  target: string | null
  position: string
  pathType: PathType
  hasDimensions: boolean | null
}

export interface CanonicalInfo {
  url: string | null
  count: number
  relative: boolean
  fragment: boolean
  outsideHead: boolean
  invalidAttribute: boolean
  conflicting: boolean
}

export interface HreflangEntry {
  lang: string
  url: string
}

export interface ParsedPage {
  title: string | null
  titleCount: number
  titleOutsideHead: boolean
  metaDescription: string | null
  metaDescriptionCount: number
  metaDescriptionOutsideHead: boolean
  metaKeywords: string | null
  metaKeywordsCount: number
  h1: string[]
  h1AltText: boolean
  h1NonSequential: boolean
  h2: string[]
  h2NonSequential: boolean
  canonical: CanonicalInfo
  metaRobots: string | null
  metaRobotsOutsideHead: boolean
  metaRefresh: string | null
  metaRefreshUrl: string | null
  relNext: string | null
  relPrev: string | null
  htmlLang: string | null
  wordCount: number
  textRatio: number
  loremIpsum: boolean
  hasForm: boolean
  formActions: string[]
  links: ExtractedLink[]
  hreflang: HreflangEntry[]
  hreflangOutsideHead: boolean
  relNextCount: number
  relPrevCount: number
  text: string
}
