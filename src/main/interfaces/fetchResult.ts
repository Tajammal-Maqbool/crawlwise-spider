export interface FetchResult {
  statusCode: number
  statusText: string
  headers: Array<[string, string]>
  contentType: string | null
  body: Buffer | null
  size: number
  transferred: number
  responseTimeMs: number
  error: string | null
  tooLarge: boolean
}
