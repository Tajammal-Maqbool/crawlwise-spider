import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX } from './bases'
import { issue } from './issue'

export const structuredDataTab = defineTab(
  {
    key: 'structured-data',
    label: 'Structured Data',
    group: 'Technical',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'sd_types', 'sd_count', 'sd_errors', 'sd_warnings', 'sd_rich_errors', 'sd_rich_warnings', 'sd_rich_features', 'sd_parse_errors']
  },
  [
    { slug: 'contains', label: 'Contains Structured Data', where: 'u.sd_count > 0' },
    { slug: 'missing', label: 'Missing', where: 'u.sd_count = 0 AND u.sd_parse_errors = 0', issue: issue('Opportunity', 'Low', 'Pages without structured data.', 'Add schema.org markup where it describes the page content.') },
    { slug: 'validation-errors', label: 'Validation Errors', where: 'u.sd_errors > 0', issue: issue('Issue', 'High', 'Structured data that breaks schema.org rules, for example an unknown type or a missing context.', 'Fix the type and context of each item.') },
    { slug: 'validation-warnings', label: 'Validation Warnings', where: 'u.sd_warnings > 0', issue: issue('Warning', 'Low', 'Structured data with schema.org warnings.', 'Review and correct the flagged properties.') },
    { slug: 'rich-result-errors', label: 'Rich Result Validation Errors', where: 'u.sd_rich_errors > 0', issue: issue('Issue', 'High', 'Structured data that misses properties a rich result needs.', 'Add the required properties for the rich result type.') },
    { slug: 'rich-result-warnings', label: 'Rich Result Validation Warnings', where: 'u.sd_rich_warnings > 0', issue: issue('Warning', 'Low', 'Structured data that misses recommended rich result properties.', 'Add the recommended properties where possible.') },
    { slug: 'parse-errors', label: 'Parse Errors', where: 'u.sd_parse_errors > 0', issue: issue('Issue', 'High', 'JSON-LD blocks that are not valid JSON.', 'Fix the JSON syntax.') },
    { slug: 'microdata', label: 'Microdata URLs', where: 'u.sd_microdata = 1' },
    { slug: 'json-ld', label: 'JSON-LD URLs', where: 'u.sd_jsonld = 1' },
    { slug: 'rdfa', label: 'RDFa URLs', where: 'u.sd_rdfa = 1' },
    { slug: 'rich-result-feature', label: 'Rich Result Feature Detected', where: 'u.sd_rich_features IS NOT NULL' }
  ]
)
