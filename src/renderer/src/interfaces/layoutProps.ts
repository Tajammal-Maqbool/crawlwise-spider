import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { CrawlProgress } from '@shared/interfaces/crawlProgress'
import type { FilterCounts } from '@shared/interfaces/filterCount'
import type { SortDirection } from '@shared/types/sortDirection'
import type { GridData } from '../hooks/useGridPage'
import type { ColumnLayoutState } from './columnLayout'
import type { GridView, UiMode } from '../types/uiMode'

export interface DataGridProps {
  data: GridData
  layout: ColumnLayoutState
  selectedId: number | null
  sortKey: string | null
  sortDirection: SortDirection
  emptyText: string
  onSelect: (id: number) => void
  onSort: (key: string) => void
  onShowLinks: (tab: 'Inlinks' | 'Outlinks') => void
}

export interface RightPanelProps {
  counts: FilterCounts
  config: CrawlConfig
  crawlId: string | null
  tick: number
  onSelectFilter: (filterKey: string) => void
}

export interface SiteStructureViewProps {
  crawlId: string | null
  tick: number
}

export interface StatusBarProps {
  progress: CrawlProgress | null
  crawlLabel: string | null
  modeLabel: string
}

export interface SplitterProps {
  orientation: 'vertical' | 'horizontal'
  cssVar: string
  min: number
  max: number
  invert?: boolean
}

export interface UrlBarProps {
  config: CrawlConfig
  uiMode: UiMode
  progress: CrawlProgress | null
  running: boolean
  onConfigChange: (config: CrawlConfig) => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onClear: () => void
  onOpenList: () => void
  onOpenCompare: () => void
}

export interface ProgressBarProps {
  percent: number
}

export interface MainTabStripProps {
  selectedTab: string
  onSelectTab: (tabKey: string) => void
}

export interface GridToolbarProps {
  filterKey: string
  config: CrawlConfig
  counts: FilterCounts
  total: number
  search: string
  view: GridView
  canExport: boolean
  onFilterChange: (filterKey: string) => void
  onSearchChange: (search: string) => void
  onViewChange: (view: GridView) => void
  onExport: () => void
}

export interface PanelDataProps {
  crawlId: string | null
  tick: number
}
