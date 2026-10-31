import type { StructuredDataResult } from '../interfaces/structuredItem'
import type { SqlValue } from '../types/sqlValue'

export function structuredFields(sd: StructuredDataResult): Record<string, SqlValue> {
  const items = sd.items
  const sum = (pick: (i: (typeof items)[number]) => number) => items.reduce((n, i) => n + pick(i), 0)
  const types = [...new Set(items.map((i) => i.type).filter(Boolean))]
  const features = [...new Set(items.map((i) => i.feature).filter(Boolean))]
  return {
    sd_count: items.length,
    sd_types: types.length ? types.join(', ') : null,
    sd_errors: sum((i) => i.errors.length),
    sd_warnings: sum((i) => i.warnings.length),
    sd_rich_errors: sum((i) => i.richErrors.length),
    sd_rich_warnings: sum((i) => i.richWarnings.length),
    sd_rich_features: features.length ? features.join(', ') : null,
    sd_parse_errors: sd.parseErrors,
    sd_jsonld: items.some((i) => i.format === 'JSON-LD') ? 1 : 0,
    sd_microdata: items.some((i) => i.format === 'Microdata') ? 1 : 0,
    sd_rdfa: items.some((i) => i.format === 'RDFa') ? 1 : 0
  }
}
