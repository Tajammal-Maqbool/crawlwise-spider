import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX } from './bases'
import { issue } from './issue'

const HAS = '(u.rel_next IS NOT NULL OR u.rel_prev IS NOT NULL)'
const targets = (cond: string) =>
  `EXISTS (SELECT 1 FROM urls t WHERE t.url IN (u.rel_next, u.rel_prev) AND ${cond})`

export const paginationTab = defineTab(
  {
    key: 'pagination',
    label: 'Pagination',
    group: 'Technical',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'rel_next_1', 'rel_prev_1', 'rel_next_count']
  },
  [
    { slug: 'contains-pagination', label: 'Contains Pagination', where: HAS },
    { slug: 'first-page', label: 'First Page', where: 'u.rel_next IS NOT NULL AND u.rel_prev IS NULL' },
    { slug: 'paginated-2-plus', label: 'Paginated 2+ Pages', where: 'u.rel_prev IS NOT NULL' },
    { slug: 'not-in-anchor', label: 'Pagination URL Not in Anchor Tag', where: `${HAS} AND NOT EXISTS (SELECT 1 FROM links l JOIN urls t ON t.id = l.dst_id WHERE l.src_id = u.id AND l.type = 'Hyperlink' AND t.url IN (u.rel_next, u.rel_prev))`, issue: issue('Warning', 'Medium', 'Paginated pages whose next or previous URL is not also linked with an anchor.', 'Link to the next and previous pages with normal anchor links.') },
    { slug: 'non-200', label: 'Non-200 Pagination URLs', where: `${HAS} AND ${targets('t.state = 3 AND NOT (t.status_code BETWEEN 200 AND 299)')}`, issue: issue('Issue', 'High', 'Pagination links that point to URLs without a 200 response.', 'Point pagination links at live pages.') },
    { slug: 'unlinked', label: 'Unlinked Pagination URLs', where: `${HAS} AND ${targets("NOT EXISTS (SELECT 1 FROM links l WHERE l.dst_id = t.id AND l.type = 'Hyperlink')")}`, issue: issue('Opportunity', 'Low', 'Pagination URLs that no anchor link on the site points to.', 'Link to all paginated pages.') },
    { slug: 'non-indexable', label: 'Non-Indexable', where: `${HAS} AND u.indexability = 'Non-Indexable'`, issue: issue('Warning', 'Medium', 'Paginated pages that are not indexable.', 'Let paginated pages be indexed with self-referencing canonicals.') },
    { slug: 'multiple', label: 'Multiple Pagination URLs', where: '(u.rel_next_count > 1 OR u.rel_prev_count > 1)', issue: issue('Issue', 'Medium', 'Pages with more than one next or previous link element.', 'Keep one next and one previous link element.') },
    { slug: 'loop', label: 'Pagination Loop', where: '(u.rel_next = u.url OR u.rel_prev = u.url)', issue: issue('Issue', 'Medium', 'Pages whose pagination points back to themselves.', 'Fix the pagination targets.') },
    { slug: 'sequence-error', label: 'Sequence Error', where: "EXISTS (SELECT 1 FROM urls n WHERE n.url = u.rel_next AND n.rel_prev IS NOT NULL AND n.rel_prev <> u.url)", issue: issue('Issue', 'Medium', 'Pages where the next page does not point back with a matching previous link.', 'Make next and previous links agree in both directions.') }
  ]
)
