export class HostThrottle {
  private readonly blockedUntil = new Map<string, number>()

  delay(host: string, ms: number): void {
    const until = Date.now() + ms
    this.blockedUntil.set(host, Math.max(this.blockedUntil.get(host) ?? 0, until))
  }

  async wait(host: string): Promise<void> {
    const until = this.blockedUntil.get(host) ?? 0
    const remaining = until - Date.now()
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
  }
}
