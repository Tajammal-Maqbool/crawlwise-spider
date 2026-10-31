import { useState } from 'react'
import { COLUMNS } from '@shared/constants/columns'
import type { GridHeaderProps } from '../../interfaces/gridProps'

const MIN_WIDTH = 50
const DRAG_TYPE = 'text/x-column'

export function GridHeader({ layout, sortKey, sortDirection, onSort, onChooseColumns, indexWidth }: GridHeaderProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const startResize = (e: React.PointerEvent, key: string) => {
    e.stopPropagation()
    e.preventDefault()
    const startX = e.clientX
    const startWidth = layout.widthOf(key)
    const move = (ev: PointerEvent) => layout.resize(key, Math.max(MIN_WIDTH, startWidth + ev.clientX - startX))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      className="grid-header"
      role="row"
      onContextMenu={(e) => {
        e.preventDefault()
        onChooseColumns(e.clientX, e.clientY)
      }}
    >
      <div className="grid-cell index" style={{ width: indexWidth }} />
      {layout.visible.map((key) => (
        <div
          key={key}
          role="columnheader"
          aria-sort={sortKey === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
          className={`grid-cell ${dropTarget === key ? 'drop-target' : ''}`}
          style={{ width: layout.widthOf(key) }}
          draggable
          onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, key)}
          onDragOver={(e) => {
            e.preventDefault()
            setDropTarget(key)
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => {
            e.preventDefault()
            setDropTarget(null)
            const moving = e.dataTransfer.getData(DRAG_TYPE)
            if (moving) layout.move(moving, key)
          }}
          onClick={() => onSort(key)}
        >
          {COLUMNS[key].label}
          {sortKey === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
          <span className="resize" onPointerDown={(e) => startResize(e, key)} onClick={(e) => e.stopPropagation()} />
        </div>
      ))}
    </div>
  )
}
