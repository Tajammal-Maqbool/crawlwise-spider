import { defineTab, type FilterSpec } from './defineTab'
import { DONE } from './bases'
import { issue } from './issue'
import type { IssueMeta } from '../../interfaces/filterDefinition'

interface CodeSet {
  slugPrefix: string
  labelPrefix: string
  scope: string
  issues: Partial<Record<string, IssueMeta>>
}

const CODE_BUCKETS: Array<{ slug: string; label: string; where: string }> = [
  { slug: 'blocked-by-robots', label: 'Blocked by Robots.txt', where: 'u.blocked_by_robots = 1' },
  { slug: 'no-response', label: 'No Response', where: 'u.status_code = 0 AND u.blocked_by_robots = 0' },
  { slug: 'success', label: 'Success (2xx)', where: 'u.status_code BETWEEN 200 AND 299' },
  { slug: 'redirection', label: 'Redirection (3xx)', where: 'u.status_code BETWEEN 300 AND 399' },
  { slug: 'redirection-meta-refresh', label: 'Redirection (Meta Refresh)', where: "u.redirect_type = 'Meta Refresh'" },
  { slug: 'redirection-http-refresh', label: 'Redirection (HTTP Refresh)', where: "u.redirect_type = 'HTTP Refresh'" },
  { slug: 'client-error', label: 'Client Error (4xx)', where: 'u.status_code BETWEEN 400 AND 499' },
  { slug: 'server-error', label: 'Server Error (5xx)', where: 'u.status_code >= 500' },
  { slug: 'all-error', label: 'All Error (4xx 5xx & No Response)', where: '(u.status_code >= 400 OR (u.status_code = 0 AND u.blocked_by_robots = 0))' }
]

const INTERNAL_ISSUES: CodeSet['issues'] = {
  'blocked-by-robots': issue('Warning', 'High', 'Internal URLs blocked by the site robots.txt. Search engines cannot crawl them.', 'Remove the disallow rule if these URLs must be crawled and indexed.'),
  'no-response': issue('Issue', 'High', 'Internal URLs that gave no response (DNS failure, timeout, refused connection or malformed URL).', 'Check that the server is reachable and that the links point to valid URLs.'),
  redirection: issue('Warning', 'Low', 'Internal URLs that redirect to another URL.', 'Update internal links to point directly at the final URL.'),
  'redirection-meta-refresh': issue('Warning', 'Low', 'Internal URLs that redirect with a meta refresh.', 'Use a 301 redirect on the server instead of a meta refresh.'),
  'redirection-http-refresh': issue('Warning', 'Low', 'Internal URLs that redirect with an HTTP Refresh header.', 'Use a 301 redirect instead of a Refresh header.'),
  'client-error': issue('Issue', 'High', 'Internal URLs with a 4xx response, for example 404 Not Found.', 'Fix or remove the links to these URLs, or redirect them to a relevant page.'),
  'server-error': issue('Issue', 'High', 'Internal URLs with a 5xx server error.', 'Find the cause of the server error and fix it.'),
  'redirect-chain': issue('Warning', 'Medium', 'Internal URLs that redirect two or more times before they reach the final URL.', 'Point the first URL and all internal links straight at the final URL.'),
  'redirect-loop': issue('Issue', 'High', 'Internal URLs that redirect in a loop and never resolve.', 'Fix the redirect rules so that the chain ends at a 200 URL.')
}

const EXTERNAL_ISSUES: CodeSet['issues'] = {
  'no-response': issue('Warning', 'Medium', 'External URLs that gave no response.', 'Check the links and remove or update links to dead sites.'),
  'client-error': issue('Issue', 'Medium', 'External URLs with a 4xx response.', 'Update or remove the links to these broken external URLs.'),
  'server-error': issue('Warning', 'Low', 'External URLs with a 5xx response.', 'Check the link later, and remove it if the error stays.')
}

const SETS: CodeSet[] = [
  { slugPrefix: '', labelPrefix: '', scope: '1 = 1', issues: {} },
  { slugPrefix: 'internal-', labelPrefix: 'Internal ', scope: 'u.is_internal = 1', issues: INTERNAL_ISSUES },
  { slugPrefix: 'external-', labelPrefix: 'External ', scope: 'u.is_internal = 0', issues: EXTERNAL_ISSUES }
]

function buildSpecs(): FilterSpec[] {
  const specs: FilterSpec[] = []
  for (const set of SETS) {
    if (set.slugPrefix) {
      specs.push({ slug: `${set.slugPrefix}all`, label: `${set.labelPrefix}All`, where: set.scope })
    }
    for (const b of CODE_BUCKETS) {
      specs.push({
        slug: `${set.slugPrefix}${b.slug}`,
        label: `${set.labelPrefix}${b.label}`,
        where: `${set.scope} AND ${b.where}`,
        issue: set.issues[b.slug]
      })
    }
    if (set.slugPrefix === 'internal-') {
      specs.push(
        { slug: 'internal-redirect-chain', label: 'Internal Redirect Chain', where: 'u.is_internal = 1 AND u.redirect_chain_length > 1 AND u.redirect_loop = 0', issue: INTERNAL_ISSUES['redirect-chain'] },
        { slug: 'internal-redirect-loop', label: 'Internal Redirect Loop', where: 'u.is_internal = 1 AND u.redirect_loop = 1', issue: INTERNAL_ISSUES['redirect-loop'] }
      )
    }
  }
  return specs
}

export const responseCodesTab = defineTab(
  {
    key: 'response-codes',
    label: 'Response Codes',
    group: 'Crawl',
    description: 'All internal and external crawled URLs',
    baseWhere: DONE(),
    columns: ['address', 'content_type', 'status_code', 'status', 'indexability', 'indexability_status', 'inlinks', 'response_time', 'redirect_url', 'redirect_type', 'redirect_chain_length', 'final_address', 'matched_robots_line']
  },
  buildSpecs()
)
