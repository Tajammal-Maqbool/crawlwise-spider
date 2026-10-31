export const OVERVIEW_ROWS: Array<{ title: string; rows: Array<{ label: string; filterKey: string }> }> = [
  {
    title: 'Summary',
    rows: [
      { label: 'Total Internal URLs', filterKey: 'internal:all' },
      { label: 'Internal HTML', filterKey: 'internal:html' },
      { label: 'Total External URLs', filterKey: 'external:all' },
      { label: 'Total URLs Crawled', filterKey: 'response-codes:all' }
    ]
  },
  {
    title: 'Response Codes',
    rows: [
      { label: 'Blocked by Robots.txt', filterKey: 'response-codes:blocked-by-robots' },
      { label: 'No Response', filterKey: 'response-codes:no-response' },
      { label: 'Success (2xx)', filterKey: 'response-codes:success' },
      { label: 'Redirection (3xx)', filterKey: 'response-codes:redirection' },
      { label: 'Client Error (4xx)', filterKey: 'response-codes:client-error' },
      { label: 'Server Error (5xx)', filterKey: 'response-codes:server-error' }
    ]
  },
  {
    title: 'Indexability',
    rows: [
      { label: 'Noindex', filterKey: 'directives:noindex' },
      { label: 'Canonicalised', filterKey: 'canonicals:canonicalised' }
    ]
  }
]
