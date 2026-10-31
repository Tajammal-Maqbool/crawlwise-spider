import { CUSTOM_SLOTS } from '@shared/constants/filterRegistry/custom'
import type { CustomSearch } from '@shared/interfaces/customRules'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { Button } from '../common/Button'

const EMPTY: CustomSearch = { name: '', mode: 'contains', scope: 'html', pattern: '', regex: false }

export function CustomSearchSection({ config, onChange }: ConfigSectionProps) {
  const rows = config.customSearches
  const update = (i: number, patch: Partial<CustomSearch>) =>
    onChange({ ...config, customSearches: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  return (
    <div className="config-section">
      <h3>Custom Search</h3>
      <p className="hint">Each rule fills one filter in the Custom Search tab.</p>
      {rows.map((r, i) => (
        <div key={i} className="field" style={{ gridTemplateColumns: '120px 140px 90px 1fr auto auto' }}>
          <input type="text" aria-label="Name" placeholder={`Filter ${i + 1}`} value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
          <select aria-label="Mode" value={r.mode} onChange={(e) => update(i, { mode: e.target.value as CustomSearch['mode'] })}>
            <option value="contains">Contains</option>
            <option value="does-not-contain">Does Not Contain</option>
          </select>
          <select aria-label="Search in" value={r.scope} onChange={(e) => update(i, { scope: e.target.value as CustomSearch['scope'] })}>
            <option value="html">HTML</option>
            <option value="text">Text</option>
          </select>
          <input type="text" aria-label="Pattern" placeholder="Text or regex" value={r.pattern} onChange={(e) => update(i, { pattern: e.target.value })} />
          <label>
            <input type="checkbox" checked={r.regex} onChange={(e) => update(i, { regex: e.target.checked })} /> Regex
          </label>
          <Button aria-label="Remove rule" onClick={() => onChange({ ...config, customSearches: rows.filter((_, j) => j !== i) })}>
            Remove
          </Button>
        </div>
      ))}
      <Button disabled={rows.length >= CUSTOM_SLOTS} onClick={() => onChange({ ...config, customSearches: [...rows, EMPTY] })}>
        Add
      </Button>
    </div>
  )
}
