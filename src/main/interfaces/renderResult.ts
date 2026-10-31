export interface AxeViolation {
  rule: string
  impact: string | null
  tags: string[]
  nodes: number
  help: string
}

export interface RenderResult {
  html: string
  errors: string[]
  warnings: string[]
  failedResources: string[]
  accessibility: AxeViolation[] | null
  screenshot?: Uint8Array | null
}

export interface PageRenderer {
  render(url: string): Promise<RenderResult | null>
}
