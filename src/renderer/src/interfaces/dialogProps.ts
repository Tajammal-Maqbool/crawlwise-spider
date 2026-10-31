import type { ReactNode } from 'react'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { CrawlSummary } from '@shared/interfaces/crawlSummary'
import type { UrlDetail } from '@shared/interfaces/urlDetail'
import type { DetailTab } from '../types/uiMode'

export interface ModalProps {
  title: string
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}

export interface ConfigDialogProps {
  config: CrawlConfig
  initialSection: string
  onSave: (config: CrawlConfig) => void
  onClose: () => void
}

export interface ConfigSectionProps {
  config: CrawlConfig
  onChange: (config: CrawlConfig) => void
}

export interface CrawlListDialogProps {
  activeCrawlId: string | null
  running: boolean
  onOpen: (crawl: CrawlSummary) => void
  onContinue: (crawl: CrawlSummary) => void
  onClose: () => void
}

export interface ListModeDialogProps {
  initial: string[]
  onStart: (urls: string[]) => void
  onClose: () => void
}

export interface DetailPaneProps {
  detail: UrlDetail | null
  config: CrawlConfig
  tab: DetailTab
  onTabChange: (tab: DetailTab) => void
}

export interface AboutDialogProps {
  onClose: () => void
}

export interface CompareDialogProps {
  crawlId: string
  config: CrawlConfig
  onClose: () => void
}

export interface ScheduleDialogProps {
  config: CrawlConfig
  onClose: () => void
}
