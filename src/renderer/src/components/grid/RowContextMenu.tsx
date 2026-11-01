import { useRef } from 'react'
import type { RowContextMenuProps } from '../../interfaces/gridProps'
import { Button } from '../common/Button'
import { api } from '../../services/ipc/api'
import { useDismiss } from '../../hooks/useDismiss'
import { useViewportClamp } from '../../hooks/useViewportClamp'

export function RowContextMenu({ url, x, y, onShowLinks, onClose }: RowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const position = useViewportClamp(menuRef, x, y)
  useDismiss(menuRef, onClose)
  const act = (work: () => void) => () => {
    work()
    onClose()
  }
  return (
    <div ref={menuRef} className="popup menu-dropdown" style={{ left: position.x, top: position.y }} role="menu" onMouseLeave={onClose}>
      <Button role="menuitem" className="menu-item" onClick={act(() => void api.copyText(url))}>
        Copy URL
      </Button>
      <Button role="menuitem" className="menu-item" onClick={act(() => window.open(url, '_blank'))}>
        Open in Browser
      </Button>
      <div className="menu-separator" role="separator" />
      <Button role="menuitem" className="menu-item" onClick={act(() => onShowLinks('Inlinks'))}>
        Show Inlinks
      </Button>
      <Button role="menuitem" className="menu-item" onClick={act(() => onShowLinks('Outlinks'))}>
        Show Outlinks
      </Button>
    </div>
  )
}
