import { useState } from 'react'
import { FILTERS, TABS } from '@shared/constants/filterRegistry'
import { OVERVIEW_ROWS } from '../../constants/overviewRows'
import type { RightPanelProps } from '../../interfaces/layoutProps'
import { filterLabel } from '../../utils/filterLabel'
import { percentOf } from '../../utils/percentOf'
import { Button } from '../common/Button'
import { PieChart } from '../charts/PieChart'

export function OverviewPanel({ counts, config, onSelectFilter }: RightPanelProps) {
  const [openTab, setOpenTab] = useState<string | null>(null)
  const totalCrawled = counts['response-codes:all'] ?? 0
  const chartTab = TABS.find((t) => t.key === openTab)
  const chartFilters = FILTERS.filter((f) => f.tabKey === openTab && !f.key.endsWith(':all'))

  return (
    <div className="panel-body">
      {OVERVIEW_ROWS.map((section) => (
        <div key={section.title}>
          <div className="group-title">{section.title}</div>
          {section.rows.map((row) => (
            <Button key={row.filterKey} className="tree-item overview-row" onClick={() => onSelectFilter(row.filterKey)}>
              <span>{row.label}</span>
              <span className="count">{(counts[row.filterKey] ?? 0).toLocaleString()}</span>
              <span className="pct">{percentOf(counts[row.filterKey] ?? 0, totalCrawled)}</span>
            </Button>
          ))}
        </div>
      ))}
      <div className="group-title">Crawl Data</div>
      {TABS.map((tab) => {
        const all = counts[`${tab.key}:all`] ?? 0
        const open = openTab === tab.key
        return (
          <div key={tab.key}>
            <Button className="tree-item overview-tab" aria-expanded={open} onClick={() => setOpenTab(open ? null : tab.key)}>
              <span>
                {open ? '▾' : '▸'} {tab.label}
              </span>
              <span className="count">{all.toLocaleString()}</span>
              <span className="pct">{percentOf(all, totalCrawled)}</span>
            </Button>
            {open &&
              FILTERS.filter((f) => f.tabKey === tab.key).map((f) => (
                <Button key={f.key} className="tree-item overview-filter" onClick={() => onSelectFilter(f.key)}>
                  <span>{filterLabel(f, config)}</span>
                  <span className="count">{(counts[f.key] ?? 0).toLocaleString()}</span>
                  <span className="pct">{percentOf(counts[f.key] ?? 0, all)}</span>
                </Button>
              ))}
          </div>
        )
      })}
      {chartTab && (
        <PieChart label={`${chartTab.label} filters`} data={chartFilters.map((f) => ({ label: filterLabel(f, config), value: counts[f.key] ?? 0 }))} />
      )}
    </div>
  )
}
