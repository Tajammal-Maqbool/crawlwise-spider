export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly'

export interface ScheduledTaskInput {
  name: string
  startUrl: string
  frequency: ScheduleFrequency
  date: string
  time: string
  outputFolder: string
  exportTabs: string[]
  bulkExports: string[]
  format: 'csv' | 'xlsx'
}

export interface ScheduledTask extends ScheduledTaskInput {
  id: string
  createdAt: string
}
