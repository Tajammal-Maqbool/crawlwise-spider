import type { ScheduledTask } from '@shared/interfaces/scheduledTask'
import { APP_NAME, APP_SLUG } from '@shared/constants/appInfo'

export const TASK_FOLDER = APP_SLUG

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function taskName(id: string): string {
  return `${TASK_FOLDER}\\${id}`
}

export function buildCmdFile(task: ScheduledTask, electronPath: string, cliPath: string, configPath: string): string {
  const args = ['--crawl', quote(task.startUrl), '--config', quote(configPath), '--output-folder', quote(task.outputFolder), '--export-format', task.format]
  if (task.exportTabs.length) args.push('--export-tabs', quote(task.exportTabs.join(',')))
  if (task.bulkExports.length) args.push('--bulk-export', quote(task.bulkExports.join(',')))
  return ['@echo off', 'set ELECTRON_RUN_AS_NODE=1', `${quote(electronPath)} ${quote(cliPath)} ${args.join(' ')}`, ''].join('\r\n')
}

export function buildTaskXml(task: ScheduledTask, cmdPath: string): string {
  const start = `${task.date}T${task.time}:00`
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>${xml(`${APP_NAME}: ${task.name}`)}</Description></RegistrationInfo>
  <Triggers>${trigger(task, start)}</Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <ExecutionTimeLimit>PT72H</ExecutionTimeLimit>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author"><Exec><Command>${xml(cmdPath)}</Command></Exec></Actions>
</Task>
`
}

export function buildCreateArgs(id: string, xmlPath: string): string[] {
  return ['/Create', '/TN', taskName(id), '/XML', xmlPath, '/F']
}

export function buildDeleteArgs(id: string): string[] {
  return ['/Delete', '/TN', taskName(id), '/F']
}

export function validateTask(task: ScheduledTask): string | null {
  if (!/^https?:\/\//i.test(task.startUrl)) return 'The start URL must begin with http:// or https://'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(task.time)) return 'The time must be HH:MM (24 hour)'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(task.date) || Number.isNaN(Date.parse(task.date))) return 'The date must be YYYY-MM-DD'
  if (!task.outputFolder.trim()) return 'Choose an output folder'
  if (/["\r\n%]/.test(task.startUrl + task.outputFolder)) return 'The URL and folder must not contain quotes, percent signs or line breaks'
  return null
}

function trigger(task: ScheduledTask, start: string): string {
  const boundary = `<StartBoundary>${start}</StartBoundary><Enabled>true</Enabled>`
  const day = new Date(`${task.date}T00:00:00`)
  switch (task.frequency) {
    case 'once':
      return `<TimeTrigger>${boundary}</TimeTrigger>`
    case 'daily':
      return `<CalendarTrigger>${boundary}<ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger>`
    case 'weekly':
      return `<CalendarTrigger>${boundary}<ScheduleByWeek><WeeksInterval>1</WeeksInterval><DaysOfWeek><${WEEKDAYS[day.getDay()]} /></DaysOfWeek></ScheduleByWeek></CalendarTrigger>`
    case 'monthly':
      return `<CalendarTrigger>${boundary}<ScheduleByMonth><DaysOfMonth><Day>${day.getDate()}</Day></DaysOfMonth><Months>${MONTHS.map((m) => `<${m} />`).join('')}</Months></ScheduleByMonth></CalendarTrigger>`
  }
}

function quote(value: string): string {
  return `"${value}"`
}

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
