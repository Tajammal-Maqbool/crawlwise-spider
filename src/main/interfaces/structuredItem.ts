export type StructuredFormat = 'JSON-LD' | 'Microdata' | 'RDFa'

export interface StructuredItem {
  format: StructuredFormat
  type: string | null
  errors: string[]
  warnings: string[]
  richErrors: string[]
  richWarnings: string[]
  feature: string | null
}

export interface StructuredDataResult {
  items: StructuredItem[]
  parseErrors: number
}
