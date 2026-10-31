import { parseArgs } from 'node:util'
import { APP_NAME } from '@shared/constants/appInfo'

export const CLI_HELP = `${APP_NAME} CLI

Usage:
  npm run cli -- --crawl <url> [options]
  npm run cli -- --list <file.txt> [options]

Options:
  --crawl <url>            Start URL for Spider mode.
  --list <file>            Text file with one URL per line (List mode).
  --config <file.json>     Crawl config JSON (any subset of the app config).
  --output-folder <dir>    Folder for the crawl database and exports. Default: current folder.
  --export-tabs <list>     Comma-separated filter keys, for example "page-titles:missing,response-codes:internal-client-error".
  --bulk-export <list>     Comma-separated bulk export keys, for example "all-inlinks,inlinks-4xx,issues-overview".
  --export-format <fmt>    csv (default) or xlsx.
  --list-exports           Print every filter key and bulk export key, then exit.
  --help                   Show this help.

Note: the CLI crawls raw HTML. JavaScript rendering, Search Console and GA4 need the desktop app.
`

export interface CliOptions {
  crawl: string | null
  list: string | null
  config: string | null
  outputFolder: string
  exportTabs: string[]
  bulkExports: string[]
  format: 'csv' | 'xlsx'
  listExports: boolean
  help: boolean
}

export function readCliOptions(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      crawl: { type: 'string' },
      list: { type: 'string' },
      config: { type: 'string' },
      'output-folder': { type: 'string' },
      'export-tabs': { type: 'string' },
      'bulk-export': { type: 'string' },
      'export-format': { type: 'string' },
      'list-exports': { type: 'boolean' },
      help: { type: 'boolean' }
    },
    strict: true
  })
  const split = (v: string | undefined) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const format = values['export-format'] ?? 'csv'
  if (format !== 'csv' && format !== 'xlsx') throw new Error('--export-format must be csv or xlsx')
  return {
    crawl: values.crawl ?? null,
    list: values.list ?? null,
    config: values.config ?? null,
    outputFolder: values['output-folder'] ?? process.cwd(),
    exportTabs: split(values['export-tabs']),
    bulkExports: split(values['bulk-export']),
    format,
    listExports: values['list-exports'] ?? false,
    help: values.help ?? false
  }
}
