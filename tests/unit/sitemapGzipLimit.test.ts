import { describe, expect, it } from 'vitest'
import { gzipSync } from 'node:zlib'
import { parseSitemap } from '../../src/main/crawler/sitemapParser'

const xml = '<urlset><url><loc>https://example.com/a</loc></url></urlset>'

describe('parseSitemap gzip limit', () => {
  it('parses a small gzipped sitemap', () => {
    expect(parseSitemap(gzipSync(xml), 'https://example.com/sitemap.xml.gz')?.urls).toEqual(['https://example.com/a'])
  })
  it('returns null when decompressed output passes the limit', () => {
    const bomb = gzipSync(xml + ' '.repeat(10_000))
    expect(parseSitemap(bomb, 'https://example.com/sitemap.xml.gz', 1000)).toBeNull()
  })
})
