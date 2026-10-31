export function jwtPayload(token: string | undefined): Record<string, unknown> | null {
  const part = token?.split('.')[1]
  if (!part) return null
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}
