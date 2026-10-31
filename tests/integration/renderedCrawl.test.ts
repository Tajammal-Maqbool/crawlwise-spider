import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import type { PageRenderer } from '../../src/main/interfaces/renderResult'
import { runFixtureCrawl, type FixtureCrawl } from '../fixtures/runFixtureCrawl'
import { getUrlDetail } from '../../src/main/db/detailService'
import { reanalyseCrawl } from '../../src/main/services/crawlAnalysis'

const PNG = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])

const fakeRenderer: PageRenderer = {
  async render(url) {
    const res = await fetch(url)
    let html = await res.text()
    if (url.endsWith('/js-page')) {
      html = html
        .replace('<title>Raw Title Before Script</title>', '<title>Title Set By Script</title>')
        .replace('<div id="app"></div>', '<div id="app"><a href="/js-only-target">JS link</a></div>')
      return { html, screenshot: PNG, errors: ['fixture script error'], warnings: [], failedResources: [], accessibility: [{ rule: 'image-alt', impact: 'critical', tags: ['wcag2a', 'wcag111'], nodes: 1, help: 'Images must have alternate text' }] }
    }
    return { html, errors: [], warnings: [], failedResources: [], accessibility: [] }
  }
}

let crawl: FixtureCrawl

beforeAll(async () => {
  crawl = await runFixtureCrawl((startUrl) => ({ ...DEFAULT_CONFIG, startUrl, rendering: { ...DEFAULT_CONFIG.rendering, mode: 'javascript', accessibility: true, screenshots: true } }), fakeRenderer)
})

afterAll(async () => {
  await crawl?.close()
})

describe('crawl with JavaScript rendering', () => {
  it('compares raw and rendered HTML', () => {
    expect(crawl.paths('javascript:title-updated')).toEqual(['/js-page'])
    expect(crawl.paths('javascript:contains-js-links')).toEqual(['/js-page'])
    expect(crawl.paths('javascript:js-errors')).toEqual(['/js-page'])
  })

  it('follows links that only exist in rendered HTML', () => {
    expect(crawl.paths('internal:html')).toContain('/js-only-target')
  })

  it('stores accessibility violations from the renderer', () => {
    expect(crawl.paths('accessibility:wcag20-a')).toEqual(['/js-page'])
    expect(crawl.paths('accessibility:critical')).toEqual(['/js-page'])
    expect(crawl.paths('accessibility:no-violations')).toContain('/')
  })

  it('stores the screenshot, the raw HTML and the rendered HTML', () => {
    const id = (crawl.db.prepare('SELECT id FROM urls WHERE url = ?').get(`${crawl.site.url}js-page`) as { id: number }).id
    const detail = getUrlDetail(crawl.db, id)
    expect(detail.screenshot).toMatch(/^data:image\/png;base64,/)
    expect(detail.source).toContain('Raw Title Before Script')
    expect(detail.renderedSource).toContain('Title Set By Script')
    expect(detail.consoleLog.join(' ')).toContain('fixture script error')
    const root = (crawl.db.prepare('SELECT id FROM urls WHERE url = ?').get(crawl.site.url) as { id: number }).id
    expect(getUrlDetail(crawl.db, root).screenshot).toBeNull()
  })
})

describe('manual crawl analysis', () => {
  it('refuses while the crawl is running', () => {
    expect(() => reanalyseCrawl('unused.sqlite', DEFAULT_CONFIG, true)).toThrow('Pause or stop the crawl first.')
  })
})
