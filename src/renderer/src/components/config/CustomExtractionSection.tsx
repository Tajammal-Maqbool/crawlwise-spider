import { CUSTOM_SLOTS } from '@shared/constants/filterRegistry/custom'
import type { CustomExtraction } from '@shared/interfaces/customRules'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { Button } from '../common/Button'

const EMPTY: CustomExtraction = { name: '', type: 'css', selector: '', output: 'text', attribute: '' }

export function CustomExtractionSection({ config, onChange }: ConfigSectionProps) {
  const rows = config.customExtractions
  const update = (i: number, patch: Partial<CustomExtraction>) =>
    onChange({ ...config, customExtractions: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  return (
    <div className="config-section">
      <h3>Custom Extraction</h3>
      <p className="hint">CSS selectors or regex. For regex, the first capture group is stored.</p>
      {rows.map((r, i) => (
        <div key={i} className="field" style={{ gridTemplateColumns: '120px 90px 1fr 110px 110px auto' }}>
          <input type="text" aria-label="Name" placeholder={`Extractor ${i + 1}`} value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
          <select aria-label="Type" value={r.type} onChange={(e) => update(i, { type: e.target.value as CustomExtraction['type'] })}>
            <option value="css">CSS Path</option>
            <option value="regex">Regex</option>
          </select>
          <input type="text" aria-label="Selector" placeholder={r.type === 'css' ? '.price' : 'sku:\\s*(\\w+)'} value={r.selector} onChange={(e) => update(i, { selector: e.target.value })} />
          <select aria-label="Output" value={r.output} disabled={r.type === 'regex'} onChange={(e) => update(i, { output: e.target.value as CustomExtraction['output'] })}>
            <option value="text">Text</option>
            <option value="html">Inner HTML</option>
            <option value="attribute">Attribute</option>
          </select>
          <input type="text" aria-label="Attribute" placeholder="href" disabled={r.output !== 'attribute' || r.type === 'regex'} value={r.attribute} onChange={(e) => update(i, { attribute: e.target.value })} />
          <Button aria-label="Remove extractor" onClick={() => onChange({ ...config, customExtractions: rows.filter((_, j) => j !== i) })}>
            Remove
          </Button>
        </div>
      ))}
      <Button disabled={rows.length >= CUSTOM_SLOTS} onClick={() => onChange({ ...config, customExtractions: [...rows, EMPTY] })}>
        Add
      </Button>
    </div>
  )
}
