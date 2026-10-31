import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX, duplicateOf } from './bases'

export const metaKeywordsTab = defineTab(
  {
    key: 'meta-keywords',
    label: 'Meta Keywords',
    group: 'On-page',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'meta_keywords_count', 'meta_keywords_1', 'meta_keywords_1_length']
  },
  [
    { slug: 'missing', label: 'Missing', where: "coalesce(u.meta_keywords, '') = ''" },
    { slug: 'duplicate', label: 'Duplicate', where: duplicateOf('meta_keywords', INTERNAL_HTML_2XX) },
    { slug: 'multiple', label: 'Multiple', where: 'u.meta_keywords_count > 1' }
  ]
)
