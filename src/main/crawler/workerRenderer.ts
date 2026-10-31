import type { MessagePort } from 'node:worker_threads'
import type { PageRenderer, RenderResult } from '../interfaces/renderResult'
import type { WorkerEvent } from '../interfaces/workerMessages'

export class WorkerRenderer implements PageRenderer {
  private nextId = 1
  private readonly pending = new Map<number, (result: RenderResult | null) => void>()

  constructor(private readonly port: MessagePort) {}

  render(url: string): Promise<RenderResult | null> {
    const requestId = this.nextId++
    return new Promise((resolve) => {
      this.pending.set(requestId, resolve)
      const event: WorkerEvent = { type: 'render', requestId, url }
      this.port.postMessage(event)
    })
  }

  resolve(requestId: number, result: RenderResult | null): void {
    this.pending.get(requestId)?.(result)
    this.pending.delete(requestId)
  }
}
