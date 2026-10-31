import type { GoogleApiContext } from '../interfaces/googleApi'
import { GoogleApiError } from './googleApiError'

const TIMEOUT_MS = 60000

interface GoogleErrorBody {
  error?: { message?: string; status?: string } | string
  error_description?: string
}

export async function googleJson<T>(google: GoogleApiContext, url: string, body?: unknown): Promise<T> {
  const token = await google.accessToken()
  const headers: Record<string, string> = { authorization: `Bearer ${token}` }
  if (body !== undefined) headers['content-type'] = 'application/json'
  const res = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  return readGoogleResponse<T>(res)
}

export async function postGoogleForm<T>(url: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  return readGoogleResponse<T>(res)
}

async function readGoogleResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  if (!res.ok) throw toError(data as GoogleErrorBody, res.status)
  return data as T
}

function toError(body: GoogleErrorBody, status: number): GoogleApiError {
  if (typeof body.error === 'string') return new GoogleApiError(body.error_description ?? body.error, status, body.error)
  return new GoogleApiError(body.error?.message ?? `HTTP ${status}`, status, body.error?.status ?? null)
}
