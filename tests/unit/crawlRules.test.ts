import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import { shouldFetch } from '../../src/main/crawler/linkPolicy'
import { indexabilityOf } from '../../src/main/crawler/responseFields'
import { CrawlScope } from '../../src/main/crawler/scope'

const link = (over: Partial<Parameters<typeof shouldFetch>[1]>) => ({
  type: 'Hyperlink' as const,
  follow: true,
  isInternal: true,
  depth: 1,
  urlLength: 30,
  ...over
})

describe('shouldFetch', () => {
  it('follows internal links but not internal nofollow by default', () => {
    expect(shouldFetch(DEFAULT_CONFIG, link({}))).toBe(true)
    expect(shouldFetch(DEFAULT_CONFIG, link({ follow: false }))).toBe(false)
  })
  it('checks external links and resources', () => {
    expect(shouldFetch(DEFAULT_CONFIG, link({ isInternal: false }))).toBe(true)
    expect(shouldFetch(DEFAULT_CONFIG, link({ type: 'Image', isInternal: false }))).toBe(true)
    const noExternal = { ...DEFAULT_CONFIG, resources: { ...DEFAULT_CONFIG.resources, checkExternalLinks: false } }
    expect(shouldFetch(noExternal, link({ isInternal: false }))).toBe(false)
  })
  it('skips pagination and hreflang by default', () => {
    expect(shouldFetch(DEFAULT_CONFIG, link({ type: 'Rel Next' }))).toBe(false)
    expect(shouldFetch(DEFAULT_CONFIG, link({ type: 'Hreflang' }))).toBe(false)
  })
  it('applies depth and URL length limits', () => {
    const shallow = { ...DEFAULT_CONFIG, limits: { ...DEFAULT_CONFIG.limits, maxDepth: 1 } }
    expect(shouldFetch(shallow, link({ depth: 2 }))).toBe(false)
    expect(shouldFetch(DEFAULT_CONFIG, link({ urlLength: 5000 }))).toBe(false)
  })
  it('crawls nothing beyond the list in list mode', () => {
    expect(shouldFetch({ ...DEFAULT_CONFIG, mode: 'list' }, link({}))).toBe(false)
  })
})

describe('indexabilityOf', () => {
  const base = { statusCode: 200, blocked: false, tooLarge: false, robotsText: '', canonical: null, url: 'https://a.com/', redirected: false }
  it('gives each non-indexable reason', () => {
    expect(indexabilityOf({ ...base, blocked: true })[1]).toBe('Blocked by robots.txt')
    expect(indexabilityOf({ ...base, statusCode: 0 })[1]).toBe('No Response')
    expect(indexabilityOf({ ...base, statusCode: 301 })[1]).toBe('Redirected')
    expect(indexabilityOf({ ...base, statusCode: 404 })[1]).toBe('Client Error')
    expect(indexabilityOf({ ...base, statusCode: 503 })[1]).toBe('Server Error')
    expect(indexabilityOf({ ...base, robotsText: 'NOINDEX, follow' })[1]).toBe('noindex')
    expect(indexabilityOf({ ...base, canonical: 'https://a.com/other' })[1]).toBe('Canonicalised')
  })
  it('marks a normal page indexable', () => {
    expect(indexabilityOf({ ...base, canonical: 'https://a.com/' })).toEqual(['Indexable', ''])
  })
})

describe('CrawlScope', () => {
  it('treats only the start host as internal by default', () => {
    const scope = new CrawlScope(DEFAULT_CONFIG, 'https://www.a.com/')
    expect(scope.isInternal('https://www.a.com/x')).toBe(true)
    expect(scope.isInternal('https://blog.a.com/x')).toBe(false)
  })
  it('includes subdomains when asked', () => {
    const config = { ...DEFAULT_CONFIG, resources: { ...DEFAULT_CONFIG.resources, crawlAllSubdomains: true } }
    expect(new CrawlScope(config, 'https://www.a.com/').isInternal('https://blog.a.com/x')).toBe(true)
  })
  it('applies include and exclude, and ignores an invalid regex', () => {
    const config = { ...DEFAULT_CONFIG, includePatterns: ['/shop/', '('], excludePatterns: ['\\?sort='] }
    const scope = new CrawlScope(config, 'https://a.com/')
    expect(scope.isAllowedByRules('https://a.com/shop/x')).toBe(true)
    expect(scope.isAllowedByRules('https://a.com/blog/x')).toBe(false)
    expect(scope.isAllowedByRules('https://a.com/shop/x?sort=1')).toBe(false)
  })
})
