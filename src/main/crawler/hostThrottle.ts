export class HostThrottle {
  private readonly blockedUntil = new Map<string, number>()
  private readonly minIntervalMs = new Map<string, number>()
  private readonly nextSlot = new Map<string, number>()

  delay(host: string, ms: number): void {
    const until = Date.now() + ms
    this.blockedUntil.set(host, Math.max(this.blockedUntil.get(host) ?? 0, until))
  }

  setMinInterval(host: string, ms: number): void {
    this.minIntervalMs.set(host, ms)
  }

  async wait(host: string): Promise<void> {
    const now = Date.now()
    const slot = Math.max(now, this.blockedUntil.get(host) ?? 0, this.nextSlot.get(host) ?? 0)
    this.nextSlot.set(host, slot + (this.minIntervalMs.get(host) ?? 0))
    if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now))
  }
}
