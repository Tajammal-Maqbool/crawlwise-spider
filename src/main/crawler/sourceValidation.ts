const HEAD_ALLOWED = new Set(['title', 'meta', 'link', 'script', 'style', 'base', 'noscript', 'template'])

export interface SourceValidation {
  headCount: number
  bodyCount: number
  headNotFirst: boolean
  invalidHeadElements: boolean
  bodyBeforeHtml: boolean
}

export function validateSource(html: string): SourceValidation {
  const clean = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '<$1>')
  const headCount = (clean.match(/<head[\s>]/gi) ?? []).length
  const bodyCount = (clean.match(/<body[\s>]/gi) ?? []).length
  const htmlIdx = clean.search(/<html[\s>]/i)
  const bodyIdx = clean.search(/<body[\s>]/i)
  const afterHtml = htmlIdx >= 0 ? clean.slice(clean.indexOf('>', htmlIdx) + 1) : clean
  const firstTag = /<([a-z][a-z0-9-]*)/i.exec(afterHtml)?.[1]?.toLowerCase()
  const headMatch = /<head[\s>]([\s\S]*?)(<\/head>|<body[\s>])/i.exec(clean)
  const headTags = headMatch ? [...headMatch[1].matchAll(/<([a-z][a-z0-9-]*)/gi)].map((m) => m[1].toLowerCase()) : []
  return {
    headCount,
    bodyCount,
    headNotFirst: headCount > 0 && firstTag !== undefined && firstTag !== 'head',
    invalidHeadElements: headTags.some((t) => !HEAD_ALLOWED.has(t)),
    bodyBeforeHtml: bodyIdx >= 0 && htmlIdx >= 0 && bodyIdx < htmlIdx
  }
}
