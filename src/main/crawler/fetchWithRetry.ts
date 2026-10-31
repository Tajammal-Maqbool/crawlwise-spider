import type { FetchResult } from '../interfaces/fetchResult'
import { fetchUrl, type FetchOptions } from './fetcher'
import { HostThrottle } from './hostThrottle'

export const MAX_RETRIES = 2
const BASE_BACKOFF_MS = 1000
const MAX_RETRY_AFTER_MS = 60000

export async function fetchWithRetry(url: string, options: FetchOptions, throttle: HostThrottle): Promise<FetchResult> {
  const host = new URL(url).host
  let result: FetchResult = await throttled(url, options, throttle, host)
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const retryAfter = retryAfterMs(result)
    if (retryAfter !== null) throttle.delay(host, retryAfter)
    else if (!isRetryable(result)) return result
    else await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1))
    result = await throttled(url, options, throttle, host)
  }
  return result
}

async function throttled(url: string, options: FetchOptions, throttle: HostThrottle, host: string): Promise<FetchResult> {
  await throttle.wait(host)
  return fetchUrl(url, options)
}

function isRetryable(result: FetchResult): boolean {
  return (result.statusCode === 0 && result.statusText !== 'DNS lookup failed') || result.statusCode >= 500
}

function retryAfterMs(result: FetchResult): number | null {
  if (result.statusCode !== 429 && result.statusCode !== 503) return null
  const header = result.headers.find(([n]) => n.toLowerCase() === 'retry-after')?.[1]
  if (!header) return result.statusCode === 429 ? BASE_BACKOFF_MS * 5 : null
  const seconds = Number(header)
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now()
  return Math.min(Math.max(ms, 0), MAX_RETRY_AFTER_MS)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
