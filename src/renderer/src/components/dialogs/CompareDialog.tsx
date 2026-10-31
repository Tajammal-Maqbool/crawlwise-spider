import { useEffect, useState } from 'react'
import { FILTERS_BY_KEY, TABS_BY_KEY } from '@shared/constants/filterRegistry'
import type { CrawlComparison, DiffCategory } from '@shared/interfaces/crawlComparison'
import type { CompareDialogProps } from '../../interfaces/dialogProps'
import { useCrawlList } from '../../hooks/useCrawlList'
import { api } from '../../services/ipc/api'
import { filterLabel } from '../../utils/filterLabel'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const CATEGORIES: DiffCategory[] = ['new', 'added', 'removed', 'missing']

export function CompareDialog({ crawlId, config, onClose }: CompareDialogProps) {
  const { crawls } = useCrawlList(true)
  const [previousId, setPreviousId] = useState('')
  const [result, setResult] = useState<CrawlComparison | null>(null)
  const [detail, setDetail] = useState<{ title: string; rows: string[][] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!previousId) return
    setResult(null)
    setDetail(null)
    api.compareCrawls(crawlId, previousId).then(setResult, (err: unknown) => setError(String(err)))
  }, [crawlId, previousId])

  const showUrls = async (filterKey: string, category: DiffCategory) => {
    const urls = await api.compareUrls(crawlId, previousId, filterKey, category)
    const f = FILTERS_BY_KEY[filterKey]
    setDetail({ title: `${TABS_BY_KEY[f.tabKey].label}: ${filterLabel(f, config)} (${category})`, rows: urls.map((u) => [u]) })
  }

  const showChanges = async (field: string) => {
    const rows = await api.compareChanges(crawlId, previousId, field)
    setDetail({ title: `Change Detection: ${field}`, rows: rows.map((r) => [r.url, r.previous, r.current]) })
  }

  const changed = result?.filters.filter((f) => f.new + f.added + f.removed + f.missing > 0) ?? []

  return (
    <Modal title="Compare Crawls" onClose={onClose}>
      <div className="config-section">
        <label className="field">
          <span>Previous crawl</span>
          <select value={previousId} onChange={(e) => setPreviousId(e.target.value)}>
            <option value="">Choose a crawl</option>
            {crawls
              .filter((c) => c.id !== crawlId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.startUrl} ({new Date(c.createdAt).toLocaleString()}, {c.urlCount} URLs)
                </option>
              ))}
          </select>
        </label>
        {error && <div className="error-banner">{error}</div>}
        {previousId && !result && !error && <p className="hint">Comparing...</p>}
        {result && (
          <>
            <h3>Change Detection</h3>
            <div>
              {result.changes.map((c) => (
                <Button key={c.field} className="tree-item filter" disabled={c.count === 0} onClick={() => void showChanges(c.field)}>
                  <span>{c.field}</span>
                  <span className="count">{c.count}</span>
                </Button>
              ))}
            </div>
            <h3>Filters with differences ({changed.length})</h3>
            <table className="simple">
              <thead>
                <tr>
                  <th>Filter</th>
                  <th>Current</th>
                  <th>Previous</th>
                  {CATEGORIES.map((c) => (
                    <th key={c}>{c[0].toUpperCase() + c.slice(1)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {changed.map((d) => (
                  <tr key={d.filterKey}>
                    <td>
                      {TABS_BY_KEY[FILTERS_BY_KEY[d.filterKey].tabKey].label}: {filterLabel(FILTERS_BY_KEY[d.filterKey], config)}
                    </td>
                    <td>{d.current}</td>
                    <td>{d.previous}</td>
                    {CATEGORIES.map((c) => (
                      <td key={c}>{d[c] > 0 ? <Button onClick={() => void showUrls(d.filterKey, c)}>{d[c]}</Button> : 0}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {detail && (
          <>
            <h3>{detail.title}</h3>
            <table className="simple">
              <tbody>
                {detail.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j} className="wrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </Modal>
  )
}
