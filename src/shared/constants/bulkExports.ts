export interface BulkExportDefinition {
  key: string
  group: 'Bulk Export' | 'Reports'
  label: string
  header: string[]
  sql: string
}

const LINK_HEADER = ['Type', 'Source', 'Destination', 'Anchor', 'Alt Text', 'Follow', 'Rel', 'Status Code', 'Status', 'Link Position', 'Link Path']
const linkSql = (where: string) => `SELECT l.type, s.url, d.url, l.anchor, l.alt, CASE l.follow WHEN 1 THEN 'True' ELSE 'False' END,
  l.rel, d.status_code, d.status_text, l.position, l.path_type
  FROM links l JOIN urls s ON s.id = l.src_id JOIN urls d ON d.id = l.dst_id WHERE ${where} ORDER BY s.id, l.id`

const inlinksTo = (label: string, key: string, cond: string): BulkExportDefinition => ({
  key,
  group: 'Bulk Export',
  label,
  header: LINK_HEADER,
  sql: linkSql(`d.state = 3 AND ${cond}`)
})

export const BULK_EXPORTS: BulkExportDefinition[] = [
  { key: 'all-inlinks', group: 'Bulk Export', label: 'Links: All Inlinks', header: LINK_HEADER, sql: linkSql('1 = 1') },
  { key: 'all-outlinks-internal', group: 'Bulk Export', label: 'Links: All Internal Outlinks', header: LINK_HEADER, sql: linkSql('d.is_internal = 1') },
  { key: 'all-outlinks-external', group: 'Bulk Export', label: 'Links: All External Outlinks', header: LINK_HEADER, sql: linkSql('d.is_internal = 0') },
  inlinksTo('Response Codes: Redirection (3xx) Inlinks', 'inlinks-3xx', 'd.status_code BETWEEN 300 AND 399'),
  inlinksTo('Response Codes: Client Error (4xx) Inlinks', 'inlinks-4xx', 'd.status_code BETWEEN 400 AND 499'),
  inlinksTo('Response Codes: Server Error (5xx) Inlinks', 'inlinks-5xx', 'd.status_code >= 500'),
  inlinksTo('Response Codes: No Response Inlinks', 'inlinks-no-response', 'd.status_code = 0 AND d.blocked_by_robots = 0'),
  inlinksTo('Response Codes: Blocked by Robots.txt Inlinks', 'inlinks-blocked', 'd.blocked_by_robots = 1'),
  { key: 'images-missing-alt', group: 'Bulk Export', label: 'Images: Images Missing Alt Text Inlinks', header: LINK_HEADER, sql: linkSql("l.type = 'Image' AND coalesce(l.alt, '') = ''") },
  {
    key: 'structured-data-issues',
    group: 'Bulk Export',
    label: 'Structured Data: Validation Errors & Warnings',
    header: ['Address', 'Format', 'Type', 'Errors', 'Warnings'],
    sql: "SELECT u.url, s.format, s.type, s.errors, s.warnings FROM structured_data s JOIN urls u ON u.id = s.url_id WHERE s.errors IS NOT NULL OR s.warnings IS NOT NULL ORDER BY u.id"
  },
  {
    key: 'hreflang-all',
    group: 'Bulk Export',
    label: 'Hreflang: All hreflang URLs',
    header: ['Address', 'Language', 'Hreflang URL', 'Source', 'Hreflang URL Status Code'],
    sql: 'SELECT u.url, h.lang, h.target, h.source, t.status_code FROM hreflang h JOIN urls u ON u.id = h.url_id LEFT JOIN urls t ON t.url = h.target ORDER BY u.id'
  },
  {
    key: 'accessibility-violations',
    group: 'Bulk Export',
    label: 'Accessibility: All Violations',
    header: ['Address', 'Rule', 'Impact', 'Elements', 'Tags', 'Help'],
    sql: "SELECT u.url, a.rule, a.impact, a.nodes, trim(a.tags, ','), a.help FROM accessibility a JOIN urls u ON u.id = a.url_id ORDER BY u.id"
  },
  {
    key: 'redirect-chains',
    group: 'Reports',
    label: 'Redirects: Redirect Chains',
    header: ['Address', 'Status Code', 'Redirect URL', 'Number of Redirects', 'Loop', 'Final Address'],
    sql: "SELECT url, status_code, redirect_url, redirect_chain_length, CASE redirect_loop WHEN 1 THEN 'True' ELSE 'False' END, final_url FROM urls WHERE redirect_chain_length > 1 OR redirect_loop = 1 ORDER BY id"
  },
  {
    key: 'crawl-overview',
    group: 'Reports',
    label: 'Crawl Overview',
    header: ['Metric', 'Value'],
    sql: `SELECT 'Total URLs Crawled', count(*) FROM urls WHERE state = 3
      UNION ALL SELECT 'Internal URLs', count(*) FROM urls WHERE state = 3 AND is_internal = 1
      UNION ALL SELECT 'External URLs', count(*) FROM urls WHERE state = 3 AND is_internal = 0
      UNION ALL SELECT 'Indexable', count(*) FROM urls WHERE state = 3 AND indexability = 'Indexable'
      UNION ALL SELECT 'Non-Indexable', count(*) FROM urls WHERE state = 3 AND indexability = 'Non-Indexable'
      UNION ALL SELECT 'Average Response Time (ms)', round(avg(response_time_ms)) FROM urls WHERE state = 3 AND status_code > 0`
  }
]

export const ISSUES_REPORT_KEY = 'issues-overview'
