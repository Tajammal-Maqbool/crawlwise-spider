export interface LoopbackLogin {
  redirectUri: string
  code: Promise<string>
  close(): void
}
