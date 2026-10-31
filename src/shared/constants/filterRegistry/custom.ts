import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX } from './bases'

export const CUSTOM_SLOTS = 10

const slots = Array.from({ length: CUSTOM_SLOTS }, (_, i) => i)

export const customSearchTab = defineTab(
  {
    key: 'custom-search',
    label: 'Custom Search',
    group: 'Custom',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'status_code', ...slots.map((i) => `custom_search_${i}`)]
  },
  slots.map((i) => ({
    slug: `filter-${i + 1}`,
    label: `Filter ${i + 1}`,
    where: `EXISTS (SELECT 1 FROM custom_values v WHERE v.url_id = u.id AND v.kind = 'search' AND v.slot = ${i})`
  }))
)

export const customExtractionTab = defineTab(
  {
    key: 'custom-extraction',
    label: 'Custom Extraction',
    group: 'Custom',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'status_code', ...slots.map((i) => `custom_extraction_${i}`)]
  },
  slots.map((i) => ({
    slug: `extractor-${i + 1}`,
    label: `Extractor ${i + 1}`,
    where: `EXISTS (SELECT 1 FROM custom_values v WHERE v.url_id = u.id AND v.kind = 'extraction' AND v.slot = ${i})`
  }))
)
