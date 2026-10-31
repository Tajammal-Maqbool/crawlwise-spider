import type { HeaderRow, LinkRow, UrlDetail } from '@shared/interfaces/urlDetail'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'

export interface FieldTableProps {
  fields: UrlDetail['fields']
}

export interface LinkTableProps {
  links: LinkRow[]
}

export interface HeaderTableProps {
  headers: HeaderRow[]
}

export interface DataTableProps {
  headers: string[]
  rows: string[][]
  empty: string
}

export interface DetailTabProps {
  detail: UrlDetail
  config: CrawlConfig
}
