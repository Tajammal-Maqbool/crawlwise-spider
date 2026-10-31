import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { promisify } from 'node:util'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { ScheduledTask, ScheduledTaskInput } from '@shared/interfaces/scheduledTask'
import { redactSecrets } from '@shared/utils/redactSecrets'
import { buildCmdFile, buildCreateArgs, buildDeleteArgs, buildTaskXml, validateTask } from './scheduleCommands'

const run = promisify(execFile)

export class Scheduler {
  constructor(
    private readonly dir: string,
    private readonly electronPath: string,
    private readonly cliPath: string
  ) {
    mkdirSync(dir, { recursive: true })
  }

  list(): ScheduledTask[] {
    return readdirSync(this.dir)
      .filter((f) => f.endsWith('.json') && !f.endsWith('.config.json'))
      .map((f) => JSON.parse(readFileSync(join(this.dir, f), 'utf8')) as ScheduledTask)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async create(input: ScheduledTaskInput, config: CrawlConfig): Promise<ScheduledTask> {
    if (process.platform !== 'win32') throw new Error('Scheduling uses Windows Task Scheduler and works on Windows only.')
    const task: ScheduledTask = { ...input, id: randomUUID(), createdAt: new Date().toISOString() }
    const problem = validateTask(task)
    if (problem) throw new Error(problem)
    const base = join(this.dir, task.id)
    writeFileSync(`${base}.config.json`, JSON.stringify(redactSecrets({ ...config, mode: 'spider', startUrl: task.startUrl })), 'utf8')
    writeFileSync(`${base}.cmd`, buildCmdFile(task, this.electronPath, this.cliPath, `${base}.config.json`), 'utf8')
    writeFileSync(`${base}.xml`, `﻿${buildTaskXml(task, `${base}.cmd`)}`, 'utf16le')
    try {
      await run('schtasks', buildCreateArgs(task.id, `${base}.xml`), { windowsHide: true })
    } catch (err) {
      this.removeFiles(task.id)
      throw new Error(`Task Scheduler refused the task: ${(err as { stderr?: string }).stderr?.trim() || String(err)}`)
    }
    writeFileSync(`${base}.json`, JSON.stringify(task, null, 2), 'utf8')
    return task
  }

  async delete(id: string): Promise<void> {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('Invalid schedule id')
    if (process.platform === 'win32') {
      await run('schtasks', buildDeleteArgs(id), { windowsHide: true }).catch(() => undefined)
    }
    this.removeFiles(id)
  }

  private removeFiles(id: string): void {
    for (const ext of ['.json', '.config.json', '.cmd', '.xml']) {
      const path = join(this.dir, `${id}${ext}`)
      if (existsSync(path)) rmSync(path, { force: true })
    }
  }
}
