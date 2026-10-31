import type { BarChartProps } from '../../interfaces/chart'
import { barRects } from '../../utils/chartScale'

const WIDTH = 260
const HEIGHT = 110

export function BarChart({ data, label }: BarChartProps) {
  const rects = barRects(data, WIDTH, HEIGHT)
  if (rects.length === 0) return null
  return (
    <svg className="chart bar-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT + 16}`} role="img" aria-label={label}>
      <line x1={0} y1={HEIGHT} x2={WIDTH} y2={HEIGHT} className="chart-axis" />
      {rects.map((r) => (
        <g key={r.label} className="chart-mark">
          <rect x={r.x} y={r.y} width={r.width} height={Math.max(r.height, r.value > 0 ? 1 : 0)} rx={2} fill="var(--chart-1)">
            <title>
              {r.label}: {r.value.toLocaleString()}
            </title>
          </rect>
          <rect x={r.x} y={0} width={r.width} height={HEIGHT} fill="transparent">
            <title>
              {r.label}: {r.value.toLocaleString()}
            </title>
          </rect>
          <text x={r.x + r.width / 2} y={HEIGHT + 12} className="chart-tick" textAnchor="middle">
            {r.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
