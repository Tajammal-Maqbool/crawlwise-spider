import { Button } from '../common/Button'
import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { COLUMNS } from '@shared/constants/columns'
import type { DataGridProps } from '../../interfaces/layoutProps'
import type { SelectionState } from '../../interfaces/selection'
import { formatCell } from '../../utils/formatCell'
import { EMPTY_SELECTION, selectRow } from '../../utils/rangeSelection'
import { rowsToTsv } from '../../utils/rowsToTsv'
import { GridHeader } from './GridHeader'
import { api } from '../../services/ipc/api'
import { ColumnChooser } from './ColumnChooser'
import { RowContextMenu } from './RowContextMenu'

const ROW_HEIGHT = 22
const INDEX_WIDTH = 56

export function DataGrid({ data, layout, selectedId, sortKey, sortDirection, emptyText, onSelect, onSort, onShowLinks }: DataGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION)
  const [chooser, setChooser] = useState<{ x: number; y: number } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; url: string } | null>(null)

  useEffect(() => setSelection(EMPTY_SELECTION), [data.total, sortKey, sortDirection])

  const virtualizer = useVirtualizer({
    count: data.total,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20
  })
  const items = virtualizer.getVirtualItems()
  const first = items[0]?.index ?? 0
  const last = items[items.length - 1]?.index ?? 0

  useEffect(() => {
    data.requestRange(first, last)
  }, [first, last, data.requestRange])

  const copySelection = () => {
    const indices = [...selection.indices].sort((a, b) => a - b)
    const rows = indices.map((i) => data.rowAt(i)).filter((r): r is Record<string, unknown> => !!r)
    if (rows.length === 0) return
    const tsv = rowsToTsv(
      layout.visible.map((k) => COLUMNS[k].label),
      rows.map((r) => layout.visible.map((k) => r[k]))
    )
    void api.copyText(tsv)
  }

  if (data.error) {
    return (
      <div className="grid">
        <div className="error-banner">
          Could not load rows: {data.error} <Button onClick={data.retry}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="grid"
      ref={scrollRef}
      role="grid"
      tabIndex={0}
      aria-rowcount={data.total}
      aria-multiselectable="true"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && e.target === e.currentTarget) {
          e.preventDefault()
          copySelection()
        }
      }}
    >
      <GridHeader layout={layout} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} indexWidth={INDEX_WIDTH} onChooseColumns={(x, y) => setChooser({ x, y })} />
      {data.total === 0 ? (
        <div className="grid-empty">{emptyText}</div>
      ) : (
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {items.map((item) => {
            const row = data.rowAt(item.index)
            const id = row ? Number(row.__id) : null
            const picked = selection.indices.has(item.index) || (id !== null && id === selectedId && selection.indices.size === 0)
            return (
              <div
                key={item.key}
                role="row"
                aria-selected={picked}
                className={`grid-row ${picked ? 'selected' : ''} ${item.index % 2 ? 'alt' : ''}`}
                style={{ top: item.start, height: ROW_HEIGHT }}
                onClick={(e) => {
                  setSelection(selectRow(selection, item.index, { shift: e.shiftKey, toggle: e.ctrlKey || e.metaKey }))
                  if (id !== null) onSelect(id)
                  scrollRef.current?.focus()
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  if (!row) return
                  if (id !== null) onSelect(id)
                  setMenu({ x: e.clientX, y: e.clientY, url: String(row.address ?? '') })
                }}
              >
                <div className="grid-cell index" style={{ width: INDEX_WIDTH }}>
                  {item.index + 1}
                </div>
                {layout.visible.map((key) => {
                  const col = COLUMNS[key]
                  const numeric = col.format === 'number' || col.format === 'bytes' || col.format === 'ms'
                  return (
                    <div key={key} role="gridcell" className={`grid-cell ${numeric ? 'num' : ''}`} style={{ width: layout.widthOf(key) }} title={row ? String(row[key] ?? '') : ''}>
                      {row ? formatCell(row[key], col.format) : ''}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
      {chooser && <ColumnChooser layout={layout} x={chooser.x} y={chooser.y} onClose={() => setChooser(null)} />}
      {menu && <RowContextMenu url={menu.url} x={menu.x} y={menu.y} onShowLinks={onShowLinks} onClose={() => setMenu(null)} />}
    </div>
  )
}
