import type { MenuDropdownProps } from '../../interfaces/menu'
import { Button } from '../common/Button'

export function MenuDropdown({ items, active, onHover, onRun }: MenuDropdownProps) {
  return (
    <div className="menu-dropdown" role="menu">
      {items.map((item, i) =>
        item.kind === 'separator' ? (
          <div key={`sep-${i}`} className="menu-separator" role="separator" />
        ) : (
          <Button
            key={item.command}
            role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
            aria-checked={item.checked}
            className={`menu-item ${i === active ? 'active' : ''}`}
            disabled={item.disabled}
            onMouseEnter={() => onHover(i)}
            onClick={() => onRun(item.command)}
          >
            <span className="menu-check">{item.checked ? '✓' : ''}</span>
            {item.label}
          </Button>
        )
      )}
    </div>
  )
}
