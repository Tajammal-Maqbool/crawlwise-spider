import { FILTERS, FILTERS_BY_KEY } from '@shared/constants/filterRegistry'
import type { GridToolbarProps } from '../../interfaces/layoutProps'
import { filterLabel } from '../../utils/filterLabel'
import { Button } from '../common/Button'

export function GridToolbar(props: GridToolbarProps) {
  const tabKey = FILTERS_BY_KEY[props.filterKey].tabKey
  return (
    <div className="filter-bar">
      <label className="inline-field">
        Filter:
        <select aria-label="Filter" value={props.filterKey} onChange={(e) => props.onFilterChange(e.target.value)}>
          {FILTERS.filter((f) => f.tabKey === tabKey).map((f) => (
            <option key={f.key} value={f.key}>
              {filterLabel(f, props.config)} ({(props.counts[f.key] ?? 0).toLocaleString()})
            </option>
          ))}
        </select>
      </label>
      <Button onClick={props.onExport} disabled={!props.canExport}>
        Export
      </Button>
      <div className="view-switch" role="group" aria-label="Table view">
        <Button aria-pressed={props.view === 'list'} className={props.view === 'list' ? 'active' : ''} onClick={() => props.onViewChange('list')}>
          List
        </Button>
        <Button aria-pressed={props.view === 'tree'} className={props.view === 'tree' ? 'active' : ''} onClick={() => props.onViewChange('tree')}>
          Tree
        </Button>
      </div>
      <span className="spacer" />
      <span className="hint">Filter Total: {props.total.toLocaleString()}</span>
      <input type="search" placeholder="Search..." aria-label="Search address" value={props.search} onChange={(e) => props.onSearchChange(e.target.value)} />
    </div>
  )
}
