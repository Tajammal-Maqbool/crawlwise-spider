import type { BarRect, ChartDatum, PieSlice } from '../interfaces/chart'

export const PIE_MAX_SLICES = 6

export function barRects(data: ChartDatum[], width: number, height: number, gap = 2): BarRect[] {
  const max = Math.max(0, ...data.map((d) => d.value))
  if (data.length === 0 || max === 0) return []
  const slot = width / data.length
  return data.map((d, i) => {
    const h = (d.value / max) * height
    return { label: d.label, value: d.value, x: i * slot + gap / 2, y: height - h, width: Math.max(1, slot - gap), height: h }
  })
}

export function foldSlices(data: ChartDatum[], max = PIE_MAX_SLICES): ChartDatum[] {
  const positive = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value)
  if (positive.length <= max) return positive
  const rest = positive.slice(max - 1).reduce((s, d) => s + d.value, 0)
  return [...positive.slice(0, max - 1), { label: 'Other', value: rest }]
}

export function pieSlices(data: ChartDatum[], radius: number): PieSlice[] {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0)
  if (total === 0) return []
  let angle = 0
  return data.map((d) => {
    const sweep = (Math.max(0, d.value) / total) * 360
    const slice = { label: d.label, value: d.value, startAngle: angle, endAngle: angle + sweep, path: arcPath(radius, angle, angle + sweep) }
    angle += sweep
    return slice
  })
}

function arcPath(r: number, start: number, end: number): string {
  if (end - start >= 359.999) return `M ${r} 0 A ${r} ${r} 0 1 1 ${r - 0.01} 0 Z`
  const point = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180
    return `${(r + r * Math.cos(rad)).toFixed(2)} ${(r + r * Math.sin(rad)).toFixed(2)}`
  }
  return `M ${r} ${r} L ${point(start)} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${point(end)} Z`
}
