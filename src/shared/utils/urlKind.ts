import type { UrlKind } from '../types/urlKind'

const EXTENSION_KINDS: Record<string, UrlKind> = {
  html: 'html', htm: 'html', php: 'html', asp: 'html', aspx: 'html',
  js: 'javascript', mjs: 'javascript',
  css: 'css',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', avif: 'image', svg: 'image', ico: 'image', bmp: 'image',
  mp4: 'media', webm: 'media', mp3: 'media', ogg: 'media', wav: 'media', mov: 'media',
  woff: 'font', woff2: 'font', ttf: 'font', otf: 'font', eot: 'font',
  xml: 'xml',
  pdf: 'pdf',
  swf: 'plugin'
}

export function kindFromContentType(contentType: string | null): UrlKind {
  if (!contentType) return 'unknown'
  const ct = contentType.split(';')[0].trim().toLowerCase()
  if (ct === 'text/html' || ct === 'application/xhtml+xml') return 'html'
  if (ct.includes('javascript') || ct.includes('ecmascript')) return 'javascript'
  if (ct === 'text/css') return 'css'
  if (ct.startsWith('image/')) return 'image'
  if (ct.startsWith('video/') || ct.startsWith('audio/')) return 'media'
  if (ct.startsWith('font/') || ct.includes('font-') || ct.includes('woff')) return 'font'
  if (ct.includes('xml')) return 'xml'
  if (ct === 'application/pdf') return 'pdf'
  if (ct.includes('shockwave') || ct.includes('x-java')) return 'plugin'
  return 'other'
}

export function kindFromExtension(url: string): UrlKind | null {
  const path = new URL(url).pathname.toLowerCase()
  const dot = path.lastIndexOf('.')
  if (dot < 0 || dot < path.lastIndexOf('/')) return null
  return EXTENSION_KINDS[path.slice(dot + 1)] ?? null
}
