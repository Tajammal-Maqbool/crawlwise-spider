import type { MessagePort } from 'node:worker_threads'
import type { GoogleApiContext } from '../interfaces/googleApi'
import type { GoogleEndpoints } from '../interfaces/googleEndpoints'
import type { WorkerEvent } from '../interfaces/workerMessages'

export class WorkerGoogleApi implements GoogleApiContext {
  private nextId = 1
  private readonly pending = new Map<number, { resolve: (token: string) => void; reject: (err: Error) => void }>()

  constructor(
    private readonly port: MessagePort,
    readonly endpoints: GoogleEndpoints
  ) {}

  accessToken(): Promise<string> {
    const requestId = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject })
      const event: WorkerEvent = { type: 'google-token', requestId }
      this.port.postMessage(event)
    })
  }

  resolve(requestId: number, token: string | null, error: string | null): void {
    const waiter = this.pending.get(requestId)
    this.pending.delete(requestId)
    if (!waiter) return
    if (token) waiter.resolve(token)
    else waiter.reject(new Error(error ?? 'No Google access token'))
  }
}
