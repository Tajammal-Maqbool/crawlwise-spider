import { readFileSync } from 'node:fs'
import type { WebContents } from 'electron'
import type { AxeViolation } from '../interfaces/renderResult'

let axeSource: string | null = null

function source(): string {
  axeSource ??= readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
  return axeSource
}

const RUN = `axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations.map((v) => ({
  rule: v.id, impact: v.impact || null, tags: v.tags, nodes: v.nodes.length, help: v.help
})))`

export async function runAxe(contents: WebContents): Promise<AxeViolation[] | null> {
  try {
    return (await contents.executeJavaScript(`${source()};\n${RUN}`, true)) as AxeViolation[]
  } catch {
    return null
  }
}
