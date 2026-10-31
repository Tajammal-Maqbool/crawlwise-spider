import type { PageSpeedOptions } from '@shared/interfaces/integrations'
import type { SqlValue } from '../types/sqlValue'

interface PsiAudit {
  numericValue?: number
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: { performance?: { score?: number | null } }
    audits?: Record<string, PsiAudit>
  }
  loadingExperience?: { overall_category?: string }
  error?: { message?: string }
}

const TIMEOUT_MS = 120000

export async function fetchPageSpeed(url: string, options: PageSpeedOptions): Promise<Record<string, SqlValue>> {
  const query = new URLSearchParams({ url, strategy: options.strategy, category: 'performance' })
  if (options.apiKey) query.set('key', options.apiKey)
  try {
    const res = await fetch(`${options.endpoint}?${query}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    const body = (await res.json()) as PsiResponse
    if (!res.ok || !body.lighthouseResult) return { psi_status: body.error?.message?.slice(0, 200) ?? `HTTP ${res.status}` }
    const audits = body.lighthouseResult.audits ?? {}
    const value = (id: string) => audits[id]?.numericValue ?? null
    const score = body.lighthouseResult.categories?.performance?.score
    return {
      psi_status: 'Success',
      psi_score: score == null ? null : Math.round(score * 100),
      psi_lcp_ms: round(value('largest-contentful-paint')),
      psi_fcp_ms: round(value('first-contentful-paint')),
      psi_tbt_ms: round(value('total-blocking-time')),
      psi_si_ms: round(value('speed-index')),
      psi_cls: value('cumulative-layout-shift'),
      psi_crux: body.loadingExperience?.overall_category ?? null
    }
  } catch (err) {
    return { psi_status: err instanceof Error ? err.message.slice(0, 200) : 'Request failed' }
  }
}

function round(v: number | null): number | null {
  return v === null ? null : Math.round(v)
}
