import { describe, expect, it } from 'vitest'
import { parseHtml } from '../../src/main/crawler/htmlParser'

const URL_ = 'https://shop.example/a/page'

describe('parseHtml', () => {
  it('reads titles, descriptions and headings', () => {
    const p = parseHtml(
      `<html lang="en"><head><title> My  Title </title><meta name="Description" content="Desc"><meta name="keywords" content="k"></head>
       <body><h2>Sub</h2><h1>Main</h1><h1><img src="/x.png" alt="Logo"></h1></body></html>`,
      URL_
    )
    expect(p.title).toBe('My Title')
    expect(p.metaDescription).toBe('Desc')
    expect(p.metaKeywords).toBe('k')
    expect(p.h1).toEqual(['Main', 'Logo'])
    expect(p.h1AltText).toBe(true)
    expect(p.h1NonSequential).toBe(true)
    expect(p.h2NonSequential).toBe(true)
    expect(p.htmlLang).toBe('en')
  })

  it('detects elements outside the head', () => {
    const p = parseHtml('<html><head></head><body><title>T</title><meta name="robots" content="noindex"><link rel="canonical" href="/c"></body></html>', URL_)
    expect(p.titleOutsideHead).toBe(true)
    expect(p.metaRobotsOutsideHead).toBe(true)
    expect(p.canonical.outsideHead).toBe(true)
  })

  it('reads canonicals and their problems', () => {
    const p = parseHtml('<head><link rel="canonical" href="/c#frag"><link rel="canonical" href="https://shop.example/d"></head>', URL_)
    expect(p.canonical.url).toBe('https://shop.example/c')
    expect(p.canonical.count).toBe(2)
    expect(p.canonical.relative).toBe(true)
    expect(p.canonical.fragment).toBe(true)
    expect(p.canonical.conflicting).toBe(true)
  })

  it('extracts links with type, follow, anchor and position', () => {
    const p = parseHtml(
      `<head><link rel="stylesheet" href="/s.css"><script src="//cdn.example/x.js"></script></head>
       <body><nav><a href="/n">Nav</a></nav><a href="/f" rel="nofollow">F</a><a href="mailto:x@y.z">M</a><a href="#top">T</a>
       <footer><a href="https://other.example/"><img src="/i.png" alt="Img"></a></footer>
       <img src="/p.png" width="1" height="2"><iframe src="/frame"></iframe></body>`,
      URL_
    )
    const byUrl = Object.fromEntries(p.links.map((l) => [`${l.type} ${l.url}`, l]))
    expect(byUrl['CSS https://shop.example/s.css']).toBeDefined()
    expect(byUrl['JavaScript https://cdn.example/x.js'].pathType).toBe('Protocol-Relative')
    expect(byUrl['Hyperlink https://shop.example/n'].position).toBe('Navigation')
    expect(byUrl['Hyperlink https://shop.example/f'].follow).toBe(false)
    expect(byUrl['Hyperlink https://other.example/'].alt).toBe('Img')
    expect(byUrl['Hyperlink https://other.example/'].position).toBe('Footer')
    expect(byUrl['Image https://shop.example/p.png'].hasDimensions).toBe(true)
    expect(byUrl['Image https://shop.example/p.png'].alt).toBeNull()
    expect(byUrl['Iframe https://shop.example/frame']).toBeDefined()
    expect(p.links.some((l) => l.url.startsWith('mailto'))).toBe(false)
    expect(p.links.some((l) => l.rawHref === '#top')).toBe(false)
  })

  it('respects the base href', () => {
    const p = parseHtml('<head><base href="https://cdn.example/root/"></head><body><a href="x">X</a></body>', URL_)
    expect(p.links[0].url).toBe('https://cdn.example/root/x')
  })

  it('reads meta refresh and counts words without scripts', () => {
    const p = parseHtml(
      '<head><meta http-equiv="refresh" content="0; URL=\'/next\'"></head><body><p>one two three</p><script>var a = "x y z"</script></body>',
      URL_
    )
    expect(p.metaRefreshUrl).toBe('https://shop.example/next')
    expect(p.wordCount).toBe(3)
    expect(p.links.find((l) => l.type === 'Meta Refresh')?.url).toBe('https://shop.example/next')
  })
})
