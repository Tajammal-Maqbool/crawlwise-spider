import type { SortDirection } from '@shared/types/sortDirection'
import type { ColumnLayoutState } from './columnLayout'

export interface GridHeaderProps {
  layout: ColumnLayoutState
  sortKey: string | null
  sortDirection: SortDirection
  indexWidth: number
  onSort: (key: string) => void
  onChooseColumns: (x: number, y: number) => void
}

export interface ColumnChooserProps {
  layout: ColumnLayoutState
  x: number
  y: number
  onClose: () => void
}

export interface RowContextMenuProps {
  url: string
  x: number
  y: number
  onShowLinks: (tab: 'Inlinks' | 'Outlinks') => void
  onClose: () => void
}

export interface TreeGridProps {
  crawlId: string | null
  filterKey: string
  tick: number
  selectedId: number | null
  onSelect: (id: number) => void
}

export interface TreeNodeProps {
  crawlId: string
  filterKey: string
  tick: number
  parentPath: string
  level: number
  selectedId: number | null
  onSelect: (id: number) => void
}
