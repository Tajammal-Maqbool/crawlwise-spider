import type { PieChartProps } from '../../interfaces/chart'
import { foldSlices, pieSlices } from '../../utils/chartScale'

const RADIUS = 52

export function PieChart({ data, label }: PieChartProps) {
  const folded = foldSlices(data)
  const slices = pieSlices(folded, RADIUS)
  if (slices.length === 0) return null
  const total = folded.reduce((s, d) => s + d.value, 0)
  return (
    <figure className="pie-chart" aria-label={label}>
      <svg className="chart" viewBox={`-2 -2 ${RADIUS * 2 + 4} ${RADIUS * 2 + 4}`} role="img" aria-label={label}>
        {slices.map((s, i) => (
          <path key={s.label} d={s.path} fill={`var(--chart-${i + 1})`} stroke="var(--chart-surface)" strokeWidth={2} className="chart-mark">
            <title>
              {s.label}: {s.value.toLocaleString()} ({Math.round((s.value / total) * 1000) / 10}%)
            </title>
          </path>
        ))}
      </svg>
      <figcaption className="chart-legend">
        {slices.map((s, i) => (
          <div key={s.label} className="legend-row">
            <span className="legend-swatch" style={{ background: `var(--chart-${i + 1})` }} />
            <span className="legend-label">{s.label}</span>
            <span className="count">{s.value.toLocaleString()}</span>
          </div>
        ))}
      </figcaption>
    </figure>
  )
}
