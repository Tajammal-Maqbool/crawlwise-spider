import type { PanelDataProps } from '../../interfaces/layoutProps'
import { usePanelData } from '../../hooks/usePanelData'
import { api } from '../../services/ipc/api'

export function ApiPanel({ crawlId, tick }: PanelDataProps) {
  const { data, error } = usePanelData(crawlId, tick, api.getApiStatus)
  if (error) return <div className="error-banner">{error}</div>
  if (!data || data.length === 0) return <p className="grid-empty">No API data in this crawl. Connect APIs in Configuration &gt; API Access.</p>
  return (
    <div className="panel-body">
      <table className="stat-table">
        <thead>
          <tr>
            <th>API</th>
            <th>URLs With Data</th>
            <th>Errors</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td className="num">{r.withData.toLocaleString()}</td>
              <td className="num">{r.errors.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
