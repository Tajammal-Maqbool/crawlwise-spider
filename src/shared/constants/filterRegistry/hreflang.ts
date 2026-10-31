import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX } from './bases'
import { issue } from './issue'

const HAS = 'u.hreflang_count > 0'
const TARGET = (cond: string) => `EXISTS (SELECT 1 FROM hreflang h JOIN urls t ON t.url = h.target WHERE h.url_id = u.id AND t.id <> u.id AND ${cond})`
const SELF_LANG = '(SELECT s.lang FROM hreflang s WHERE s.url_id = u.id AND s.target = u.url LIMIT 1)'

export const hreflangTab = defineTab(
  {
    key: 'hreflang',
    label: 'Hreflang',
    group: 'Technical',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'language', 'hreflang_count', 'hreflang_values']
  },
  [
    { slug: 'contains', label: 'Contains hreflang', where: HAS },
    { slug: 'non-200', label: 'Non-200 hreflang URLs', where: TARGET('t.state = 3 AND NOT (t.status_code BETWEEN 200 AND 299)'), issue: issue('Issue', 'High', 'Pages with hreflang annotations that point to URLs without a 200 response.', 'Point hreflang annotations at live, indexable pages.') },
    { slug: 'unlinked', label: 'Unlinked hreflang URLs', where: TARGET("NOT EXISTS (SELECT 1 FROM links l WHERE l.dst_id = t.id AND l.type = 'Hyperlink')"), issue: issue('Opportunity', 'Low', 'Hreflang target URLs that no anchor link points to.', 'Link to alternate language pages from the site.') },
    { slug: 'not-using-canonical', label: 'Not Using Canonical', where: TARGET("t.indexability_status = 'Canonicalised'"), issue: issue('Issue', 'High', 'Hreflang annotations that point to canonicalised URLs.', 'Use the canonical URL in hreflang annotations.') },
    { slug: 'missing-self-reference', label: 'Missing Self Reference', where: `${HAS} AND NOT EXISTS (SELECT 1 FROM hreflang s WHERE s.url_id = u.id AND s.target = u.url)`, issue: issue('Issue', 'High', 'Pages with hreflang that do not include themselves.', 'Add a self-referencing hreflang entry.') },
    { slug: 'missing-return-links', label: 'Missing Return Links', where: TARGET('t.state = 3 AND t.status_code BETWEEN 200 AND 299 AND NOT EXISTS (SELECT 1 FROM hreflang r WHERE r.url_id = t.id AND r.target = u.url)'), issue: issue('Issue', 'High', 'Alternate pages that do not link back with hreflang.', 'Add matching return hreflang annotations on every alternate page.') },
    { slug: 'non-canonical-return-links', label: 'Non-Canonical Return Links', where: "EXISTS (SELECT 1 FROM hreflang h JOIN urls t ON t.url = h.target JOIN hreflang r ON r.url_id = t.id JOIN urls x ON x.url = r.target WHERE h.url_id = u.id AND x.canonical = u.url AND x.url <> u.url)", issue: issue('Issue', 'High', 'Return hreflang links that point to a non-canonical version of this page.', 'Use canonical URLs in all return annotations.') },
    { slug: 'noindex-return-links', label: 'Noindex Return Links', where: TARGET("t.indexability_status = 'noindex'"), issue: issue('Issue', 'High', 'Hreflang annotations that point to noindex pages.', 'Remove noindex pages from hreflang sets.') },
    { slug: 'inconsistent-language', label: 'Inconsistent Language & Region Return Links', where: `${SELF_LANG} IS NOT NULL AND EXISTS (SELECT 1 FROM hreflang h JOIN urls t ON t.url = h.target JOIN hreflang r ON r.url_id = t.id WHERE h.url_id = u.id AND t.id <> u.id AND r.target = u.url AND lower(r.lang) <> lower(${SELF_LANG}))`, issue: issue('Warning', 'Medium', 'Return links that use a different language code for this page than the page uses for itself.', 'Use the same language code for a page everywhere.') },
    { slug: 'incorrect-codes', label: 'Incorrect Language & Region Codes', where: 'u.hreflang_invalid_codes > 0', issue: issue('Issue', 'High', 'Hreflang annotations with invalid language or region codes.', 'Use ISO 639-1 language codes and optional ISO 3166-1 alpha-2 region codes.') },
    { slug: 'multiple-entries', label: 'Multiple Entries', where: 'EXISTS (SELECT 1 FROM hreflang h WHERE h.url_id = u.id GROUP BY lower(h.lang) HAVING count(DISTINCT h.target) > 1)', issue: issue('Issue', 'Medium', 'Pages that give one language code several different URLs.', 'Use one URL per language code.') },
    { slug: 'missing-x-default', label: 'Missing X-Default', where: `${HAS} AND NOT EXISTS (SELECT 1 FROM hreflang h WHERE h.url_id = u.id AND lower(h.lang) = 'x-default')`, issue: issue('Opportunity', 'Low', 'Pages with hreflang but no x-default entry.', 'Add an x-default entry for users with no matching language.') },
    { slug: 'missing', label: 'Missing', where: 'u.hreflang_count = 0 AND EXISTS (SELECT 1 FROM hreflang)', issue: issue('Warning', 'Low', 'Pages without hreflang on a site that uses hreflang elsewhere.', 'Add hreflang to pages that have alternate versions.') },
    { slug: 'outside-head', label: 'Outside <head>', where: 'u.hreflang_outside_head = 1', issue: issue('Issue', 'High', 'Pages with hreflang link elements outside the <head>.', 'Move hreflang link elements into the <head>.') }
  ]
)
