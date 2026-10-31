import { COLUMNS } from '@shared/constants/columns'
import type { ColumnChooserProps } from '../../interfaces/gridProps'

export function ColumnChooser({ layout, x, y, onClose }: ColumnChooserProps) {
  return (
    <div className="popup column-chooser" style={{ left: x, top: y }} role="dialog" aria-label="Columns" onMouseLeave={onClose}>
      <div className="group-title">Columns</div>
      {layout.columns.map((c) => (
        <label key={c.key} className="field check">
          <input type="checkbox" checked={c.visible} onChange={() => layout.toggle(c.key)} />
          <span>{COLUMNS[c.key]?.label ?? c.key}</span>
        </label>
      ))}
    </div>
  )
}
