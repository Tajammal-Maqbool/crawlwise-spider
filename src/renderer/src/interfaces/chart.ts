export interface ChartDatum {
  label: string
  value: number
}

export interface BarRect {
  label: string
  value: number
  x: number
  y: number
  width: number
  height: number
}

export interface PieSlice {
  label: string
  value: number
  startAngle: number
  endAngle: number
  path: string
}

export interface BarChartProps {
  data: ChartDatum[]
  label: string
}

export interface PieChartProps {
  data: ChartDatum[]
  label: string
}
