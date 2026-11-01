import { describe, expect, it } from 'vitest'
import { validateTask } from '../../src/main/services/scheduleCommands'
import { validateScheduleEnvironment } from '../../src/main/services/scheduleRules'
import { DEFAULT_CONFIG } from '../../src/shared/constants/defaultConfig'
import type { ScheduledTask } from '../../src/shared/interfaces/scheduledTask'
import type { CrawlConfig } from '../../src/shared/interfaces/crawlConfig'

const base: ScheduledTask = {
  id: 'x', createdAt: '', name: 'n', startUrl: 'https://example.com', frequency: 'once',
  date: '2030-01-01', time: '10:00', outputFolder: 'C:\out', exportTabs: ['internal:all'], bulkExports: ['all_inlinks'], format: 'csv'
}

describe('validateTask', () => {
  it('accepts a valid task', () => expect(validateTask(base)).toBeNull())
  it('rejects an unknown format', () => {
    expect(validateTask({ ...base, format: 'csv & calc' as 'csv' })).toMatch(/format/i)
  })
  it('rejects export tabs with quotes', () => {
    expect(validateTask({ ...base, exportTabs: ['a" & calc "'] })).toMatch(/export/i)
  })
  it('rejects bulk exports with quotes', () => {
    expect(validateTask({ ...base, bulkExports: ['x"y'] })).toMatch(/export/i)
  })
})

describe('validateScheduleEnvironment', () => {
  const config: CrawlConfig = DEFAULT_CONFIG
  const withIntegrations = (sc: boolean, ga: boolean): CrawlConfig => ({
    ...config,
    integrations: {
      ...config.integrations,
      searchConsole: { ...config.integrations.searchConsole, enabled: sc },
      analytics: { ...config.integrations.analytics, enabled: ga }
    }
  })
  it('accepts the installed app with no Google import', () => {
    expect(validateScheduleEnvironment(withIntegrations(false, false), {})).toBeNull()
  })
  it('refuses the portable exe', () => {
    expect(validateScheduleEnvironment(config, { PORTABLE_EXECUTABLE_DIR: 'C:/portable' })).toMatch(/portable version cannot run scheduled tasks/)
  })
  it('refuses Search Console import', () => {
    expect(validateScheduleEnvironment(withIntegrations(true, false), {})).toMatch(/Search Console and GA4/)
  })
  it('refuses GA4 import', () => {
    expect(validateScheduleEnvironment(withIntegrations(false, true), {})).toMatch(/Search Console and GA4/)
  })
})
