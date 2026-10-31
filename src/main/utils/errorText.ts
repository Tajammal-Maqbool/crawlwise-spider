export function errorText(err: unknown, maxLength = 300): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, maxLength)
}
