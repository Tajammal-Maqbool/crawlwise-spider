import type { CheerioAPI } from 'cheerio'
import type { Element } from 'domhandler'
import { KNOWN_SCHEMA_TYPES } from '../constants/schemaTypes'
import { RICH_RESULT_RULES } from '../constants/richResultRules'
import type { StructuredDataResult, StructuredFormat, StructuredItem } from '../interfaces/structuredItem'

type Props = Record<string, unknown>

export function extractStructuredData($: CheerioAPI): StructuredDataResult {
  const items: StructuredItem[] = []
  let parseErrors = 0

  $('script[type]').each((_, el) => {
    if (($(el).attr('type') ?? '').toLowerCase().trim() !== 'application/ld+json') return
    let json: unknown
    try {
      json = JSON.parse($(el).text())
    } catch {
      parseErrors += 1
      return
    }
    for (const node of jsonLdNodes(json)) items.push(validate('JSON-LD', jsonLdType(node), node, hasSchemaContext(node, json)))
  })

  $('[itemscope]').each((_, el) => {
    if ($(el).attr('itemprop') !== undefined) return
    const type = lastSegment($(el).attr('itemtype'))
    items.push(validate('Microdata', type, microdataProps($, el), true))
  })

  $('[typeof]').each((_, el) => {
    if ($(el).parents('[typeof]').length > 0) return
    const type = lastSegment(($(el).attr('typeof') ?? '').split(/\s+/)[0])
    const props: Props = {}
    $(el)
      .find('[property]')
      .each((_, p) => {
        props[lastSegment($(p).attr('property')) ?? ''] = true
      })
    items.push(validate('RDFa', type, props, true))
  })

  return { items, parseErrors }
}

function jsonLdNodes(json: unknown): Props[] {
  if (Array.isArray(json)) return json.flatMap(jsonLdNodes)
  if (!json || typeof json !== 'object') return []
  const obj = json as Props
  if (Array.isArray(obj['@graph'])) return (obj['@graph'] as unknown[]).flatMap(jsonLdNodes)
  return [obj]
}

function jsonLdType(node: Props): string | null {
  const t = node['@type']
  const first = Array.isArray(t) ? t[0] : t
  return typeof first === 'string' ? lastSegment(first) : null
}

function hasSchemaContext(node: Props, root: unknown): boolean {
  const ctx = node['@context'] ?? (root && typeof root === 'object' && !Array.isArray(root) ? (root as Props)['@context'] : undefined)
  const text = typeof ctx === 'string' ? ctx : JSON.stringify(ctx ?? '')
  return /schema\.org/i.test(text)
}

function microdataProps($: CheerioAPI, scope: Element): Props {
  const props: Props = {}
  $(scope)
    .find('[itemprop]')
    .each((_, el) => {
      if ($(el).parent().closest('[itemscope]').get(0) !== scope) return
      props[$(el).attr('itemprop') ?? ''] = true
    })
  return props
}

function validate(format: StructuredFormat, type: string | null, props: Props, contextOk: boolean): StructuredItem {
  const errors: string[] = []
  const warnings: string[] = []
  if (!contextOk) errors.push('Missing or invalid @context (expected schema.org)')
  if (!type) errors.push('Missing @type')
  else if (!KNOWN_SCHEMA_TYPES.has(type)) errors.push(`Unknown schema.org type: ${type}`)

  const rule = type ? RICH_RESULT_RULES[type] : undefined
  const richErrors: string[] = []
  const richWarnings: string[] = []
  if (rule) {
    for (const req of rule.required) {
      const options = Array.isArray(req) ? req : [req]
      if (!options.some((o) => present(props[o]))) richErrors.push(`Missing required property: ${options.join(' or ')}`)
    }
    for (const rec of rule.recommended) if (!present(props[rec])) richWarnings.push(`Missing recommended property: ${rec}`)
  }
  return { format, type, errors, warnings, richErrors, richWarnings, feature: rule ? rule.feature : null }
}

function present(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

function lastSegment(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/\/$/, '')
  const part = trimmed.split(/[/#:]/).pop()
  return part ? part : null
}
