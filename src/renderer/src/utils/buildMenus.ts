import { BULK_EXPORTS, ISSUES_REPORT_KEY } from '@shared/constants/bulkExports'
import { CONFIG_SECTIONS } from '../components/config/configSections'
import { MENU_COMMANDS as C, REPORT_KEYS } from '../constants/menus'
import type { MenuContext, MenuDefinition, MenuItem } from '../interfaces/menu'
import { APP_NAME } from '@shared/constants/appInfo'

const item = (command: string, label: string, disabled = false, checked?: boolean): MenuItem => ({ kind: 'item', command, label, disabled, checked })
const separator: MenuItem = { kind: 'separator' }

export function buildMenus(ctx: MenuContext): MenuDefinition[] {
  const noCrawl = !ctx.hasCrawl
  return [
    {
      label: 'File',
      items: [item(C.clear, 'Clear', ctx.running), item(C.crawls, 'Crawls...'), separator, item(C.schedule, 'Scheduling...'), separator, item(C.exit, 'Exit')]
    },
    {
      label: 'Mode',
      items: [
        item(C.modeSpider, 'Spider', ctx.running, ctx.mode === 'spider'),
        item(C.modeList, 'List', ctx.running, ctx.mode === 'list'),
        item(C.modeCompare, 'Compare', ctx.running || noCrawl, ctx.mode === 'compare')
      ]
    },
    { label: 'Configuration', items: CONFIG_SECTIONS.map((s) => item(`${C.configPrefix}${s.key}`, `${s.label}...`)) },
    {
      label: 'Bulk Export',
      items: BULK_EXPORTS.filter((b) => !REPORT_KEYS.includes(b.key)).map((b) => item(`${C.exportPrefix}${b.key}`, b.label, noCrawl))
    },
    {
      label: 'Reports',
      items: [
        item(`${C.exportPrefix}${ISSUES_REPORT_KEY}`, 'Issues Overview', noCrawl),
        ...BULK_EXPORTS.filter((b) => REPORT_KEYS.includes(b.key)).map((b) => item(`${C.exportPrefix}${b.key}`, b.label, noCrawl))
      ]
    },
    { label: 'Crawl Analysis', items: [item(C.analyse, 'Start', noCrawl || ctx.running)] },
    {
      label: 'View',
      items: [item(C.themeLight, 'Light Theme', false, ctx.theme === 'light'), item(C.themeDark, 'Dark Theme', false, ctx.theme === 'dark'), separator, item(C.resetColumns, 'Reset Columns for All Tables')]
    },
    { label: 'Help', items: [item(C.about, `About ${APP_NAME}`)] }
  ]
}
