import type { FetchResult } from '../interfaces/fetchResult'

export interface FetchOptions {
  userAgent: string
  timeoutMs: number
  maxBytes: number
  extraHeaders: Record<string, string>
}

export async function fetchUrl(url: string, options: FetchOptions): Promise<FetchResult> {
  const started = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': options.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        ...options.extraHeaders
      }
    })
    const headers: Array<[string, string]> = []
    res.headers.forEach((value, name) => headers.push([name, value]))
    const { body, size, tooLarge } = await readBody(res, options.maxBytes)
    const declared = Number(res.headers.get('content-length'))
    return {
      statusCode: res.status,
      statusText: res.statusText || '',
      headers,
      contentType: res.headers.get('content-type'),
      body,
      size,
      transferred: Number.isFinite(declared) && declared > 0 ? declared : size,
      responseTimeMs: Math.round(performance.now() - started),
      error: null,
      tooLarge
    }
  } catch (err) {
    return {
      statusCode: 0,
      statusText: describeError(err, controller.signal.aborted),
      headers: [],
      contentType: null,
      body: null,
      size: 0,
      transferred: 0,
      responseTimeMs: Math.round(performance.now() - started),
      error: err instanceof Error ? err.message : String(err),
      tooLarge: false
    }
  } finally {
    clearTimeout(timer)
  }
}

async function readBody(res: Response, maxBytes: number): Promise<{ body: Buffer | null; size: number; tooLarge: boolean }> {
  if (!res.body) return { body: null, size: 0, tooLarge: false }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return { body: null, size, tooLarge: true }
    }
    chunks.push(value)
  }
  return { body: Buffer.concat(chunks), size, tooLarge: false }
}

function describeError(err: unknown, aborted: boolean): string {
  if (aborted) return 'Connection Timeout'
  const code = (err as { cause?: { code?: string } })?.cause?.code
  switch (code) {
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return 'DNS lookup failed'
    case 'ECONNREFUSED':
      return 'Connection Refused'
    case 'ECONNRESET':
      return 'Connection Reset'
    case 'ETIMEDOUT':
    case 'UND_ERR_CONNECT_TIMEOUT':
      return 'Connection Timeout'
    default:
      if (code && /CERT|SSL|TLS/i.test(code)) return 'SSL/TLS Error'
      return 'Invalid HTTP Response'
  }
}
