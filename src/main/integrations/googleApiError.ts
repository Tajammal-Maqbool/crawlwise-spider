export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null
  ) {
    super(message)
    this.name = 'GoogleApiError'
  }
}
