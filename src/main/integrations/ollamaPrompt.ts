import type { AiOptions } from '@shared/interfaces/integrations'

const DEFAULT_URL = 'http://localhost:11434'
const TIMEOUT_MS = 300000

export function createOllamaRunner(options: AiOptions): (prompt: string) => Promise<string> {
  const base = (options.baseUrl || DEFAULT_URL).replace(/\/$/, '')
  return async (prompt) => {
    try {
      const res = await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: options.model, prompt, stream: false }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })
      const body = (await res.json()) as { response?: string; error?: string }
      if (!res.ok) return `Error: ${body.error ?? `HTTP ${res.status}`}`.slice(0, 300)
      return (body.response ?? '').trim()
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300)
    }
  }
}
