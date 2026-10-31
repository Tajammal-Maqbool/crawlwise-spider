export const MENU_COMMANDS = {
  clear: 'file:clear',
  crawls: 'file:crawls',
  schedule: 'file:schedule',
  exit: 'file:exit',
  modeSpider: 'mode:spider',
  modeList: 'mode:list',
  modeCompare: 'mode:compare',
  configPrefix: 'config:',
  exportPrefix: 'export:',
  analyse: 'analysis:start',
  themeLight: 'view:theme-light',
  themeDark: 'view:theme-dark',
  resetColumns: 'view:reset-columns',
  about: 'help:about'
} as const

export const REPORT_KEYS: string[] = ['crawl-overview', 'redirect-chains']
