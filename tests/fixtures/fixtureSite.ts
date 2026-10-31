import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { page } from './fixturePage'
import { phaseTwoRoutes } from './phaseTwoRoutes'

type Handler = { status?: number; headers?: Record<string, string>; body?: string | Buffer }


const desc = (text: string) => `<meta name="description" content="${text}">`
const LONG_DESC = 'A meta description that is long enough to pass the lower limit for descriptions in the crawler.'
const EXACT_DUP = page('Exact Duplicate Page', '<h1>Same</h1><h2>Same</h2><p>Identical body text.</p>', desc(LONG_DESC))

function routes(port: number): Record<string, Handler> {
  const ext = `http://localhost:${port}`
  return {
    '/robots.txt': { headers: { 'content-type': 'text/plain' }, body: `User-agent: *\nDisallow: /private/\nSitemap: http://127.0.0.1:${port}/sitemap.xml\n` },
    ...phaseTwoRoutes(port),
    '/': {
      body: page(
        'Fixture Shop Home Page For Testing',
        `<nav><a href="/missing-title">Missing</a><a href="/dup-a">Dup A</a><a href="/dup-b">Dup B</a></nav>
        <h1>Home</h1><h2>Welcome</h2>
        <a href="/long-title">Long</a> <a href="/no-desc">No desc</a> <a href="/multi-h1">Multi</a>
        <a href="/no-h1">No H1</a> <a href="/does-not-exist">Broken</a> <a href="/server-error">500</a>
        <a href="/redirect-1">Redirect</a> <a href="/loop-a">Loop</a> <a href="/canonicalised">Canon</a>
        <a href="/noindex">Noindex</a> <a href="/nofollow-target" rel="nofollow">Nofollow</a>
        <a href="/private/secret">Private</a> <a href="/images">Images</a> <a href="/Upper_Case">Upper</a>
        <a href="/lorem">Lorem</a> <a href="/meta-refresh">Refresh</a> <a href="/exact-a">Exact A</a>
        <a href="/exact-b">Exact B</a> <a href="${ext}/external-page">External</a>
        <a href="/no-anchor"></a> <a href="/dup-a">click here</a> <a href="/en">EN</a> <a href="/products">Products</a>
        <a href="/near-1">Near 1</a> <a href="/near-2">Near 2</a> <a href="/list?page=1">List</a> <a href="/js-page">JS</a>`,
        `${desc(LONG_DESC)}<link rel="canonical" href="/">`
      )
    },
    '/missing-title': { body: page(null, '<h1>No title here</h1>', desc(LONG_DESC)) },
    '/dup-a': { body: page('Duplicate Title Shared By Two Pages', '<h1>Dup A</h1>', desc(LONG_DESC)) },
    '/dup-b': { body: page('Duplicate Title Shared By Two Pages', '<h1>Dup B</h1>', desc(LONG_DESC)) },
    '/long-title': { body: page('This Page Title Is Far Too Long To Display In Full In The Search Results Page', '<h1>Long</h1>', desc(LONG_DESC)) },
    '/no-desc': { body: page('Page Without A Meta Description Here', '<h1>No desc</h1>') },
    '/multi-h1': { body: page('Page With Two H1 Headings On It Here', '<h1>First</h1><h1>Second</h1>', desc(LONG_DESC)) },
    '/no-h1': { body: page('Page Without Any H1 Heading At All', '<h2>Only H2</h2>', desc(LONG_DESC)) },
    '/server-error': { status: 500, body: 'error' },
    '/redirect-1': { status: 301, headers: { location: '/redirect-2' } },
    '/redirect-2': { status: 301, headers: { location: '/final' } },
    '/final': { body: page('Final Destination Page Of Redirects', '<h1>Final</h1>', desc(LONG_DESC)) },
    '/loop-a': { status: 302, headers: { location: '/loop-b' } },
    '/loop-b': { status: 302, headers: { location: '/loop-a' } },
    '/canonicalised': { body: page('Canonicalised Page Pointing Elsewhere', '<h1>Canon</h1>', `${desc(LONG_DESC)}<link rel="canonical" href="/final">`) },
    '/noindex': { body: page('Noindex Page That Should Not Be Indexed', '<h1>Noindex</h1>', `${desc(LONG_DESC)}<meta name="robots" content="noindex, follow">`) },
    '/nofollow-target': { body: page('Nofollow Target', '<h1>Hidden</h1>') },
    '/private/secret': { body: page('Secret', '<h1>Secret</h1>') },
    '/images': {
      body: page(
        'Images Page With Several Image Problems',
        '<h1>Images</h1><img src="/img/no-alt.png"><img src="/img/empty-alt.png" alt=""><img src="/img/large.png" alt="Large" width="10" height="10">',
        desc(LONG_DESC)
      )
    },
    '/img/no-alt.png': { headers: { 'content-type': 'image/png' }, body: Buffer.alloc(500) },
    '/img/empty-alt.png': { headers: { 'content-type': 'image/png' }, body: Buffer.alloc(500) },
    '/img/large.png': { headers: { 'content-type': 'image/png' }, body: Buffer.alloc(200 * 1024) },
    '/Upper_Case': { body: page('Uppercase And Underscore URL Page', '<h1>Upper</h1>', desc(LONG_DESC)) },
    '/lorem': { body: page('Lorem Ipsum Placeholder Content Page', '<h1>Lorem</h1><p>Lorem ipsum dolor sit amet.</p>', desc(LONG_DESC)) },
    '/meta-refresh': { body: page('Meta Refresh Page', '', '<meta http-equiv="refresh" content="0; url=/final">') },
    '/exact-a': { body: EXACT_DUP },
    '/exact-b': { body: EXACT_DUP },
    '/no-anchor': { body: page('Page Reached By A Link Without Anchor', '<h1>No anchor</h1>', desc(LONG_DESC)) },
    '/external-page': { body: page('External', '<h1>External</h1>') }
  }
}

export interface FixtureSite {
  url: string
  port: number
  requests: string[]
  close: () => Promise<void>
}

export async function startFixtureSite(): Promise<FixtureSite> {
  const requests: string[] = []
  let table: Record<string, Handler> = {}
  const server: Server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0]
    requests.push(`${req.method} ${req.headers.host}${path}`)
    const h = table[path]
    if (!h) {
      res.writeHead(404, { 'content-type': 'text/html' })
      res.end(page('Not Found', '<h1>404</h1>'))
      return
    }
    res.writeHead(h.status ?? 200, { 'content-type': 'text/html; charset=utf-8', ...h.headers })
    res.end(h.body ?? '')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  table = routes(port)
  return {
    url: `http://127.0.0.1:${port}/`,
    port,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  }
}
