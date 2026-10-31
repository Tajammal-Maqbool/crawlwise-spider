import { useSiteStructure } from '../../hooks/useSiteStructure'
import type { SiteStructureViewProps } from '../../interfaces/layoutProps'

export function SiteStructureView({ crawlId, tick }: SiteStructureViewProps) {
  const structure = useSiteStructure(crawlId, tick)
  if (!structure || structure.depths.length === 0) return <p className="grid-empty">No crawl data yet.</p>
  const max = Math.max(...structure.depths.map((d) => d.count))
  return (
    <div>
      <div className="group-title">Crawl Depth (internal HTML)</div>
      {structure.depths.map((d) => (
        <div key={d.depth} className="overview-row" title={`${d.count} URLs at depth ${d.depth}`}>
          <span style={{ width: 24 }}>{d.depth}</span>
          <span className="progress-bar" style={{ margin: '0 8px', height: 10 }}>
            <div style={{ width: `${(d.count / max) * 100}%` }} />
          </span>
          <span className="value">{d.count.toLocaleString()}</span>
        </div>
      ))}
      <div className="group-title">Directory Tree</div>
      {structure.folders.map((f) => (
        <div key={f.path} className="overview-row" style={{ paddingLeft: 10 + (f.path.split('/').length - 2) * 14 }}>
          <span>{f.path}</span>
          <span className="value">{f.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
