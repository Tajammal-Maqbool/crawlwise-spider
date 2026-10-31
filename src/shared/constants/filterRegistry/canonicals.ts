import { defineTab } from './defineTab'
import { INTERNAL_2XX } from './bases'
import { issue } from './issue'

const HAS_CANONICAL = '(u.canonical_count > 0 OR u.http_canonical IS NOT NULL)'
const CANONICAL = 'coalesce(u.canonical, u.http_canonical)'

export const canonicalsTab = defineTab(
  {
    key: 'canonicals',
    label: 'Canonicals',
    group: 'Technical',
    description: 'Internal HTML or PDF pages with a 2xx response',
    baseWhere: `${INTERNAL_2XX()} AND u.kind IN ('html', 'pdf')`,
    columns: ['address', 'indexability', 'indexability_status', 'canonical_link_element_1', 'http_canonical']
  },
  [
    { slug: 'contains-canonical', label: 'Contains Canonical', where: HAS_CANONICAL },
    { slug: 'self-referencing', label: 'Self Referencing', where: `${CANONICAL} = u.url` },
    { slug: 'canonicalised', label: 'Canonicalised', where: `${HAS_CANONICAL} AND ${CANONICAL} <> u.url`, issue: issue('Warning', 'High', 'Pages that point their canonical at a different URL.', 'Check that the canonical target is correct, and link to the canonical URL.') },
    { slug: 'missing', label: 'Missing', where: `NOT ${HAS_CANONICAL}`, issue: issue('Warning', 'Medium', 'Pages without a canonical link element or HTTP canonical.', 'Add a self-referencing canonical to each indexable page.') },
    { slug: 'multiple', label: 'Multiple', where: 'u.canonical_count > 1', issue: issue('Issue', 'Medium', 'Pages with more than one canonical.', 'Keep one canonical per page.') },
    { slug: 'non-indexable-canonical', label: 'Non-Indexable Canonical', where: `${HAS_CANONICAL} AND EXISTS (SELECT 1 FROM urls c WHERE c.url = ${CANONICAL} AND c.state = 3 AND c.indexability = 'Non-Indexable')`, issue: issue('Issue', 'High', 'Pages whose canonical target is non-indexable (for example a redirect, an error or a noindex page).', 'Point the canonical at an indexable 200 page.') },
    { slug: 'multiple-conflicting', label: 'Multiple Conflicting', where: 'u.canonical_conflicting = 1', issue: issue('Issue', 'High', 'Pages with several canonicals that point to different URLs.', 'Keep one canonical with the correct URL.') },
    { slug: 'canonical-is-relative', label: 'Canonical Is Relative', where: 'u.canonical_relative = 1', issue: issue('Warning', 'Low', 'Pages with a relative canonical URL.', 'Use an absolute URL in the canonical.') },
    { slug: 'unlinked', label: 'Unlinked', where: `${HAS_CANONICAL} AND ${CANONICAL} <> u.url AND NOT EXISTS (SELECT 1 FROM urls c JOIN links l ON l.dst_id = c.id AND l.type = 'Hyperlink' WHERE c.url = ${CANONICAL})`, issue: issue('Opportunity', 'Low', 'Canonical target URLs that no hyperlink on the site points to.', 'Link to the canonical URL from the site.') },
    { slug: 'invalid-attribute-in-annotation', label: 'Invalid Attribute In Annotation', where: 'u.canonical_invalid_attribute = 1', issue: issue('Issue', 'High', 'Canonical link elements with attributes that search engines may reject (for example hreflang or media).', 'Remove the extra attributes from the canonical link element.') },
    { slug: 'contains-fragment-url', label: 'Contains Fragment URL', where: 'u.canonical_fragment = 1', issue: issue('Issue', 'High', 'Canonicals that contain a # fragment.', 'Remove the fragment from the canonical URL.') },
    { slug: 'outside-head', label: 'Outside <head>', where: 'u.canonical_outside_head = 1', issue: issue('Issue', 'High', 'Pages with a canonical link element outside the <head>. Search engines ignore it.', 'Move the canonical into the <head>.') }
  ]
)
