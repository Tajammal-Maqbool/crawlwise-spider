export class ProgressMeter {
  private baseline = 0
  private activeMs = 0
  private activeSince: number | null = null

  constructor(private readonly now: () => number = Date.now) {}

  start(crawledSoFar: number): void {
    this.baseline = crawledSoFar
  }

  setActive(active: boolean): void {
    if (active && this.activeSince === null) this.activeSince = this.now()
    if (!active && this.activeSince !== null) {
      this.activeMs += this.now() - this.activeSince
      this.activeSince = null
    }
  }

  average(crawled: number): number {
    const ms = this.activeMs + (this.activeSince === null ? 0 : this.now() - this.activeSince)
    if (ms <= 0) return 0
    return Math.round(((crawled - this.baseline) / (ms / 1000)) * 10) / 10
  }
}
