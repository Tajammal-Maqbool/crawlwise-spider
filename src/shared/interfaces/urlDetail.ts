export interface LinkRow {
  fromUrl: string
  toUrl: string
  type: string
  anchor: string | null
  alt: string | null
  follow: boolean
  rel: string | null
  position: string | null
  pathType: string | null
  statusCode: number | null
}

export interface HeaderRow {
  name: string
  value: string
}

export interface CookieRow {
  name: string
  value: string
  domain: string
  path: string
  expires: string
  sameSite: string
  secure: boolean
  httpOnly: boolean
}

export interface DuplicateRow {
  url: string
  similarity: number
}

export interface StructuredDataRow {
  format: string
  type: string | null
  errors: string | null
  warnings: string | null
}

export interface AccessibilityRow {
  rule: string
  impact: string | null
  tags: string
  nodes: number
  help: string | null
}

export interface UrlDetail {
  url: string
  fields: Array<{ label: string; value: string }>
  inlinks: LinkRow[]
  outlinks: LinkRow[]
  images: LinkRow[]
  resources: LinkRow[]
  headers: HeaderRow[]
  cookies: CookieRow[]
  duplicates: DuplicateRow[]
  structuredData: StructuredDataRow[]
  accessibility: AccessibilityRow[]
  consoleLog: string[]
  source: string | null
  renderedSource: string | null
  screenshot: string | null
}
