import { useState } from 'react'
import { FILTERS, FILTERS_BY_KEY, TABS_BY_KEY } from '@shared/constants/filterRegistry'
import { ISSUE_PRIORITY_ORDER, ISSUE_TYPE_ORDER } from '../../constants/issueOrder'
import type { RightPanelProps } from '../../interfaces/layoutProps'
import { filterLabel } from '../../utils/filterLabel'
import { percentOf } from '../../utils/percentOf'
import { Button } from '../common/Button'

export function IssuesPanel({ counts, config, onSelectFilter }: RightPanelProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const issues = FILTERS.filter((f) => f.issue && (counts[f.key] ?? 0) > 0).sort(
    (a, b) =>
      ISSUE_TYPE_ORDER[a.issue!.type] - ISSUE_TYPE_ORDER[b.issue!.type] ||
      ISSUE_PRIORITY_ORDER[a.issue!.priority] - ISSUE_PRIORITY_ORDER[b.issue!.priority] ||
      (counts[b.key] ?? 0) - (counts[a.key] ?? 0)
  )
  const total = counts['internal:all'] ?? 0
  const byType = (type: string) => issues.filter((f) => f.issue!.type === type).length
  const detail = selected ? FILTERS_BY_KEY[selected] : null

  return (
    <div className="panel-body issues-panel">
      <div className="issue-totals">
        <span>Issues: {byType('Issue')}</span>
        <span>Warnings: {byType('Warning')}</span>
        <span>Opportunities: {byType('Opportunity')}</span>
        <span>Total: {issues.length}</span>
      </div>
      {issues.length === 0 ? (
        <p className="grid-empty">No issues found yet.</p>
      ) : (
        <div className="issue-list">
          {issues.map((f) => (
            <Button
              key={f.key}
              className={`issue-item ${selected === f.key ? 'selected' : ''}`}
              onClick={() => {
                setSelected(f.key)
                onSelectFilter(f.key)
              }}
            >
              <span>
                {TABS_BY_KEY[f.tabKey].label}: {filterLabel(f, config)}
              </span>
              <span className="meta">
                {f.issue!.type} <span className={`badge ${f.issue!.priority}`}>{f.issue!.priority}</span>
              </span>
              <span className="count">{(counts[f.key] ?? 0).toLocaleString()}</span>
              <span className="pct">{percentOf(counts[f.key] ?? 0, total)}</span>
            </Button>
          ))}
        </div>
      )}
      {detail?.issue && (
        <div className="issue-detail">
          <h4>{filterLabel(detail, config)}</h4>
          <p>
            <strong>Description:</strong> {detail.issue.description}
          </p>
          <p>
            <strong>How To Fix:</strong> {detail.issue.howToFix}
          </p>
        </div>
      )}
    </div>
  )
}
