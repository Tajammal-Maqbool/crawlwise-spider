export type CustomSearchMode = 'contains' | 'does-not-contain'

export type CustomSearchScope = 'html' | 'text'

export interface CustomSearch {
  name: string
  mode: CustomSearchMode
  scope: CustomSearchScope
  pattern: string
  regex: boolean
}

export type CustomExtractionType = 'css' | 'regex'

export type CustomExtractionOutput = 'text' | 'html' | 'attribute'

export interface CustomExtraction {
  name: string
  type: CustomExtractionType
  selector: string
  output: CustomExtractionOutput
  attribute: string
}
