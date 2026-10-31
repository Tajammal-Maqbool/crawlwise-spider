import { page } from './fixturePage'

type Handler = { status?: number; headers?: Record<string, string>; body?: string | Buffer }

const DESC = '<meta name="description" content="A meta description long enough to pass the lower limit for descriptions.">'
const STORY = 'The quick brown fox jumps over the lazy dog near the river bank while the farmer watches from the old wooden gate and counts his sheep one by one as the sun goes down behind the hills.'

export function phaseTwoRoutes(port: number): Record<string, Handler> {
  const base = `http://127.0.0.1:${port}`
  const xml = (body: string): Handler => ({ headers: { 'content-type': 'application/xml' }, body })
  return {
    '/sitemap.xml': xml(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>${base}/</loc></url><url><loc>${base}/orphan</loc></url><url><loc>${base}/gone-from-sitemap</loc></url>
      </urlset>`),
    '/orphan': { body: page('Orphan Page Only Found In The Sitemap', '<h1>Orphan</h1>', DESC) },
    '/gsc-orphan': { body: page('Orphan Page Only Found In Search Console', '<h1>GSC orphan</h1>', DESC) },
    '/en': {
      body: page('English Page With Hreflang Annotations', '<h1>EN</h1>', `${DESC}<link rel="alternate" hreflang="en" href="${base}/en"><link rel="alternate" hreflang="de" href="${base}/de"><link rel="alternate" hreflang="xx-QQ" href="${base}/en">`)
    },
    '/de': { body: page('German Page Without A Return Hreflang Link', '<h1>DE</h1>', DESC) },
    '/products': {
      body: page(
        'Products Page With Structured Data Blocks',
        `<h1>Products</h1><p>CUSTOM-MARKER</p><span class="price">19.99</span>`,
        `${DESC}<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Shoe","offers":{"@type":"Offer","price":"19.99"}}</script>
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"Recipe","name":"Cake"}</script>
        <script type="application/ld+json">{ broken json </script>`
      )
    },
    '/near-1': { body: page('First Near Duplicate Story Page', `<h1>Story</h1><p>${STORY} ${STORY}</p><p>Version one.</p>`, DESC) },
    '/near-2': { body: page('Second Near Duplicate Story Page', `<h1>Story</h1><p>${STORY} ${STORY}</p><p>Version two.</p>`, DESC) },
    '/list': { body: page('Paginated List First Page Here', '<h1>List</h1><a href="/list-2">Next</a>', `${DESC}<link rel="next" href="/list-2">`) },
    '/js-page': {
      body: page(
        'Raw Title Before Script',
        '<h1>JS</h1><div id="app"></div><script>document.title = "Title Set By Script"; var a = document.createElement("a"); a.href = "/js-only-target"; a.textContent = "JS link"; document.getElementById("app").appendChild(a); console.error("fixture script error")</script>',
        DESC
      )
    },
    '/js-only-target': { body: page('Page Reached Only Through A Script Link', '<h1>JS target</h1>', DESC) },
    '/list-2': { body: page('Paginated List Second Page Here', '<h1>List 2</h1>', `${DESC}<link rel="prev" href="/wrong-prev">`) }
  }
}
