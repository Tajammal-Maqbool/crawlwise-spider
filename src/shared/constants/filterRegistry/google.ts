import { defineTab } from './defineTab'
import { DONE } from './bases'
import { issue } from './issue'

const INSPECTED = "u.gsc_inspection_status = 'Success'"
const ORPHAN = "u.unique_inlinks = 0 AND coalesce(u.found_via, '') <> 'Seed'"

export const searchConsoleTab = defineTab(
  {
    key: 'search-console',
    label: 'Search Console',
    group: 'Integrations',
    description: 'Internal URLs with Search Console data (needs Search Console enabled in API Access)',
    baseWhere: 'u.is_internal = 1 AND (u.gsc_has_data IS NOT NULL OR u.gsc_inspection_status IS NOT NULL)',
    columns: ['address', 'indexability', 'gsc_clicks', 'gsc_impressions', 'gsc_ctr', 'gsc_position', 'gsc_verdict', 'gsc_coverage', 'gsc_last_crawl', 'gsc_google_canonical', 'gsc_user_canonical', 'gsc_rich_verdict']
  },
  [
    { slug: 'clicks-above-0', label: 'Clicks Above 0', where: 'u.gsc_clicks > 0' },
    { slug: 'no-data', label: 'No Search Analytics Data', where: 'u.gsc_has_data = 0', issue: issue('Warning', 'Low', 'Crawled pages with no clicks or impressions in the date range.', 'Check that these pages are indexable, linked and useful for searchers.') },
    { slug: 'non-indexable-with-data', label: 'Non-Indexable With Search Analytics Data', where: `${DONE()} AND u.gsc_has_data = 1 AND u.indexability = 'Non-Indexable'`, issue: issue('Warning', 'High', 'Non-indexable pages that still get impressions in Google Search.', 'Make sure these pages are meant to be non-indexable, or fix the directive or redirect.') },
    { slug: 'orphan-urls', label: 'Orphan URLs', where: `u.gsc_has_data = 1 AND ${ORPHAN}`, issue: issue('Warning', 'High', 'URLs with Search Console data that no crawled internal link points to.', 'Link to these pages from the site, or redirect or remove them.') },
    { slug: 'not-on-google', label: 'URL Is Not on Google', where: `${INSPECTED} AND coalesce(u.gsc_verdict, '') <> 'PASS'`, issue: issue('Issue', 'High', 'Inspected URLs that Google has not indexed.', 'Read the coverage state, then fix the cause, for example noindex, robots.txt or low quality.') },
    { slug: 'indexable-not-indexed', label: 'Indexable URL Not Indexed', where: `${INSPECTED} AND u.indexability = 'Indexable' AND coalesce(u.gsc_verdict, '') <> 'PASS'`, issue: issue('Issue', 'High', 'Pages that the crawl finds indexable but Google has not indexed.', 'Improve internal links and content, then request indexing.') },
    { slug: 'on-google-with-issues', label: 'URL Is on Google, But Has Issues', where: `${INSPECTED} AND u.gsc_verdict = 'PASS' AND u.gsc_rich_verdict = 'FAIL'`, issue: issue('Warning', 'Medium', 'Indexed URLs with invalid enhancements.', 'Fix the structured data errors that Search Console reports.') },
    { slug: 'canonical-not-selected', label: 'User-Declared Canonical Not Selected', where: `${INSPECTED} AND u.gsc_google_canonical IS NOT NULL AND u.gsc_user_canonical IS NOT NULL AND u.gsc_google_canonical <> u.gsc_user_canonical`, issue: issue('Warning', 'Medium', 'Google chose a different canonical URL than the page declares.', 'Make the canonical, internal links, redirects and sitemaps agree on one URL.') },
    { slug: 'rich-result-invalid', label: 'Rich Result Invalid', where: `${INSPECTED} AND u.gsc_rich_verdict = 'FAIL'`, issue: issue('Issue', 'Medium', 'Inspected URLs with rich result errors.', 'Fix the required structured data properties.') },
    { slug: 'inspection-error', label: 'URL Inspection Error', where: `u.gsc_inspection_status IS NOT NULL AND u.gsc_inspection_status <> 'Success'`, issue: issue('Warning', 'Low', 'URLs where the URL Inspection request failed.', 'Check that the URL belongs to the property, then run the crawl again.') }
  ]
)

export const analyticsTab = defineTab(
  {
    key: 'analytics',
    label: 'Analytics',
    group: 'Integrations',
    description: 'Internal URLs with GA4 data (needs GA4 enabled in API Access)',
    baseWhere: 'u.is_internal = 1 AND u.ga_has_data IS NOT NULL',
    columns: ['address', 'indexability', 'ga_sessions', 'ga_users', 'ga_views', 'ga_engagement_rate', 'ga_avg_duration', 'ga_bounce_rate', 'ga_key_events']
  },
  [
    { slug: 'sessions-above-0', label: 'Sessions Above 0', where: 'u.ga_sessions > 0' },
    { slug: 'bounce-rate-above-70', label: 'Bounce Rate Above 70%', where: 'u.ga_sessions > 0 AND u.ga_bounce_rate > 0.7', issue: issue('Opportunity', 'Low', 'Pages where more than 70% of sessions are not engaged.', 'Check that the page matches what visitors expect and loads fast.') },
    { slug: 'no-data', label: 'No GA Data', where: 'u.ga_has_data = 0', issue: issue('Warning', 'Low', 'Crawled pages with no GA4 sessions in the date range.', 'Check the GA4 tag on these pages and how visitors reach them.') },
    { slug: 'non-indexable-with-data', label: 'Non-Indexable With GA Data', where: `${DONE()} AND u.ga_has_data = 1 AND u.indexability = 'Non-Indexable'`, issue: issue('Warning', 'Medium', 'Non-indexable pages that still get GA4 sessions.', 'Make sure these pages are meant to be non-indexable.') },
    { slug: 'orphan-urls', label: 'Orphan URLs', where: `u.ga_has_data = 1 AND ${ORPHAN}`, issue: issue('Warning', 'High', 'URLs with GA4 sessions that no crawled internal link points to.', 'Link to these pages from the site, or redirect or remove them.') }
  ]
)
