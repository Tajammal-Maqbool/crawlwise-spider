export function decodeBody(body: Buffer, contentType: string | null): string {
  const charset = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType ?? '')?.[1] ?? sniffCharset(body) ?? 'utf-8'
  try {
    return new TextDecoder(charset).decode(body)
  } catch {
    return new TextDecoder('utf-8').decode(body)
  }
}

function sniffCharset(body: Buffer): string | null {
  const head = body.subarray(0, 2048).toString('latin1')
  return /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head)?.[1] ?? null
}
