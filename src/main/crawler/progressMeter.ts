export class ProgressMeter {
  private lastCount = 0
  private lastTick = Date.now()
  private current = 0

  rate(count: number): number {
    const now = Date.now()
    const elapsed = (now - this.lastTick) / 1000
    if (elapsed >= 1) {
      this.current = Math.round(((count - this.lastCount) / elapsed) * 10) / 10
      this.lastCount = count
      this.lastTick = now
    }
    return this.current
  }
}
