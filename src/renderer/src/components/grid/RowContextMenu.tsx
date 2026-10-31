import type { RowContextMenuProps } from '../../interfaces/gridProps'
import { Button } from '../common/Button'
import { api } from '../../services/ipc/api'

export function RowContextMenu({ url, x, y, onShowLinks, onClose }: RowContextMenuProps) {
  const act = (work: () => void) => () => {
    work()
    onClose()
  }
  return (
    <div className="popup menu-dropdown" style={{ left: x, top: y }} role="menu" onMouseLeave={onClose}>
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
