import type { PanelDataProps } from '../../interfaces/layoutProps'
import { usePanelData } from '../../hooks/usePanelData'
import { api } from '../../services/ipc/api'
import { BarChart } from '../charts/BarChart'

export function ResponseTimesPanel({ crawlId, tick }: PanelDataProps) {
  const { data, loading, error } = usePanelData(crawlId, tick, api.getResponseTimes)
  if (error) return <div className="error-banner">{error}</div>
  if (loading) return <p className="grid-empty">Loading...</p>
  if (!data || data.buckets.every((b) => b.urls === 0)) return <p className="grid-empty">No crawl data yet.</p>
  return (
    <div className="panel-body">
      <BarChart label="URLs by response time in seconds" data={data.buckets.map((b) => ({ label: b.label.replace(' - ', '-').replace('Over ', '>'), value: b.urls }))} />
      <p className="hint">Average Response Time: {data.averageSeconds.toFixed(3)} seconds</p>
      <table className="stat-table">
        <thead>
          <tr>
            <th>Response Time (Seconds)</th>
            <th>URLs</th>
            <th>% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.buckets.map((b) => (
            <tr key={b.label}>
              <td>{b.label}</td>
              <td className="num">{b.urls.toLocaleString()}</td>
              <td className="num">{b.percent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
