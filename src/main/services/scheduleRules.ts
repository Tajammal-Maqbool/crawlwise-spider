import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { GOOGLE_IMPORT_SCHEDULE_ERROR, PORTABLE_SCHEDULE_ERROR } from '../constants/schedule'

export function validateScheduleEnvironment(config: CrawlConfig, env: NodeJS.ProcessEnv): string | null {
  if (env.PORTABLE_EXECUTABLE_DIR) return PORTABLE_SCHEDULE_ERROR
  if (config.integrations.searchConsole.enabled || config.integrations.analytics.enabled) return GOOGLE_IMPORT_SCHEDULE_ERROR
  return null
}
