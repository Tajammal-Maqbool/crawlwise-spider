export const PORTABLE_SCHEDULE_ERROR = 'Scheduled crawls need the installed version of Crawlwise Spider. The portable version cannot run scheduled tasks.'
export const GOOGLE_IMPORT_SCHEDULE_ERROR =
  'Search Console and GA4 data import is only available in the desktop app. Turn off Search Console and GA4 in the configuration to schedule this crawl.'
export const EXPORT_NAME_PATTERN = /^[a-z0-9:_-]+$/i
export const EXPORT_FORMATS: readonly string[] = ['csv', 'xlsx']
