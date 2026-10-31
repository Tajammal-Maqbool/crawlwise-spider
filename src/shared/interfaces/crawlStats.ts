export interface DepthStat {
  depth: number
  urls: number
  percent: number
}

export interface ResponseTimeBucket {
  label: string
  urls: number
  percent: number
}

export interface ResponseTimeStats {
  buckets: ResponseTimeBucket[]
  averageSeconds: number
}

export interface ApiStatusRow {
  name: string
  withData: number
  errors: number
}
