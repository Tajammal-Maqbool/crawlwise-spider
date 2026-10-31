import { parentPort, workerData } from 'node:worker_threads'
import { statSync } from 'node:fs'
import { openCrawlDb } from '../db/openCrawlDb'
import type { CrawlWorkerData, WorkerCommand, WorkerEvent } from '../interfaces/workerMessages'
import { CrawlEngine } from './engine'
import { WorkerRenderer } from './workerRenderer'
import { WorkerGoogleApi } from './workerGoogleApi'

const data = workerData as CrawlWorkerData
const post = (event: WorkerEvent) => parentPort?.postMessage(event)

const fileSize = () => {
  try {
    return statSync(data.dbPath).size + (statSync(`${data.dbPath}-wal`, { throwIfNoEntry: false })?.size ?? 0)
  } catch {
    return 0
  }
}

const renderer = parentPort ? new WorkerRenderer(parentPort) : null
const google = parentPort ? new WorkerGoogleApi(parentPort, data.googleEndpoints) : null
const db = openCrawlDb(data.dbPath)
const engine = new CrawlEngine(db, data.config, data.crawlId, (progress) => post({ type: 'progress', progress }), fileSize, renderer, google)

parentPort?.on('message', (command: WorkerCommand) => {
  if (command.type === 'pause') engine.pause()
  else if (command.type === 'resume') engine.resume()
  else if (command.type === 'stop') engine.stop()
  else if (command.type === 'rendered') renderer?.resolve(command.requestId, command.result)
  else if (command.type === 'google-token') google?.resolve(command.requestId, command.token, command.error)
})

engine
  .run(data.resume)
  .then((progress) => post({ type: 'finished', progress }))
  .catch((err) => post({ type: 'error', message: err instanceof Error ? err.message : String(err) }))
  .finally(() => {
    db.close()
    parentPort?.close()
  })
