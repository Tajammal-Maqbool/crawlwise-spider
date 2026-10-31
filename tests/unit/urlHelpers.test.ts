import { describe, expect, it } from 'vitest'
import { normalizeUrl } from '@shared/utils/normalizeUrl'
import { computeUrlFlags } from '@shared/utils/urlFlags'
import { pathTypeOf } from '@shared/utils/pathType'
import { kindFromContentType, kindFromExtension } from '@shared/utils/urlKind'
import { pixelWidth } from '@shared/utils/pixelWidth'
import { toCsv } from '@shared/utils/csv'

describe('normalizeUrl', () => {
  it('resolves relative URLs and drops fragments', () => {
    expect(normalizeUrl('../b?x=1#top', 'https://Example.com/a/c/')).toBe('https://example.com/a/b?x=1')
  })
  it('rejects non-HTTP schemes and junk', () => {
    expect(normalizeUrl('mailto:a@b.c')).toBeNull()
    expect(normalizeUrl('javascript:void(0)', 'https://a.com/')).toBeNull()
    expect(normalizeUrl('   ')).toBeNull()
  })
  it('removes default ports', () => {
    expect(normalizeUrl('https://a.com:443/x')).toBe('https://a.com/x')
  })
})

describe('computeUrlFlags', () => {
  it('flags each URL problem', () => {
    const f = computeUrlFlags('https://a.com/Shop_Items//shop/shop?utm_source=x&q=shoes')
    expect(f.uppercase).toBe(true)
    expect(f.underscores).toBe(true)
    expect(f.multipleSlashes).toBe(true)
    expect(f.repetitivePath).toBe(true)
    expect(f.parameters).toBe(true)
    expect(f.gaParameters).toBe(true)
    expect(f.internalSearch).toBe(true)
  })
  it('gives a clean URL no flags', () => {
    const f = computeUrlFlags('https://a.com/products/blue-shoes/')
    expect([f.uppercase, f.underscores, f.multipleSlashes, f.repetitivePath, f.parameters, f.nonAscii, f.containsSpace]).toEqual([false, false, false, false, false, false, false])
    expect(f.folderDepth).toBe(2)
  })
  it('detects non-ASCII and spaces', () => {
    expect(computeUrlFlags('https://a.com/caf%C3%A9').nonAscii).toBe(true)
    expect(computeUrlFlags('https://a.com/a%20b').containsSpace).toBe(true)
  })
})

describe('pathTypeOf', () => {
  it('classifies hrefs', () => {
    expect(pathTypeOf('https://a.com/x')).toBe('Absolute')
    expect(pathTypeOf('//a.com/x')).toBe('Protocol-Relative')
    expect(pathTypeOf('/x')).toBe('Root-Relative')
    expect(pathTypeOf('x/y')).toBe('Path-Relative')
  })
})

describe('url kind', () => {
  it('maps content types', () => {
    expect(kindFromContentType('text/html; charset=utf-8')).toBe('html')
    expect(kindFromContentType('application/javascript')).toBe('javascript')
    expect(kindFromContentType('image/webp')).toBe('image')
    expect(kindFromContentType('font/woff2')).toBe('font')
    expect(kindFromContentType('application/rss+xml')).toBe('xml')
    expect(kindFromContentType(null)).toBe('unknown')
  })
  it('maps extensions', () => {
    expect(kindFromExtension('https://a.com/x/logo.PNG')).toBe('image')
    expect(kindFromExtension('https://a.com/x/')).toBeNull()
  })
})

describe('pixelWidth', () => {
  it('measures Arial text', () => {
    expect(pixelWidth('', 20)).toBe(0)
    expect(pixelWidth('iiii', 20)).toBeLessThan(pixelWidth('WWWW', 20))
    expect(pixelWidth('Hello World', 20)).toBe(103)
  })
})

describe('toCsv', () => {
  it('quotes cells that need it and adds a BOM', () => {
    const csv = toCsv(['A', 'B'], [['x,y', 'say "hi"'], [null, 3]])
    expect(csv).toBe('﻿A,B\r\n"x,y","say ""hi"""\r\n,3\r\n')
  })
})
