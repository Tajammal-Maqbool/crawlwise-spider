import type { PanelDataProps } from '../../interfaces/layoutProps'
import { usePanelData } from '../../hooks/usePanelData'
import { api } from '../../services/ipc/api'
import { BarChart } from '../charts/BarChart'

export function CrawlDepthPanel({ crawlId, tick }: PanelDataProps) {
  const { data, error } = usePanelData(crawlId, tick, api.getDepthStats)
  if (error) return <div className="error-banner">{error}</div>
  if (!data || data.length === 0) return <p className="grid-empty">No crawl data yet.</p>
  return (
    <div className="panel-body">
      <BarChart label="URLs by crawl depth" data={data.map((d) => ({ label: String(d.depth), value: d.urls }))} />
      <table className="stat-table">
        <thead>
          <tr>
            <th>Depth (Clicks From Start URL)</th>
            <th>URLs</th>
            <th>% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.depth}>
              <td>{d.depth}</td>
              <td className="num">{d.urls.toLocaleString()}</td>
              <td className="num">{d.percent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
