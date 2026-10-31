import { defineTab } from './defineTab'
import { INTERNAL } from './bases'
import { issue } from './issue'

const IN_SITEMAP = 'EXISTS (SELECT 1 FROM sitemap_entries e WHERE e.url_id = u.id)'
const MAX_SITEMAP_URLS = 50000
const MAX_SITEMAP_BYTES = 50 * 1024 * 1024

export const sitemapsTab = defineTab(
  {
    key: 'sitemaps',
    label: 'Sitemaps',
    group: 'Technical',
    description: 'Internal HTML and XML URLs',
    baseWhere: `${INTERNAL()} AND u.kind IN ('html', 'xml')`,
    columns: ['address', 'content_type', 'status_code', 'indexability', 'indexability_status', 'sitemap_count', 'sitemap_url_count', 'unique_inlinks']
  },
  [
    { slug: 'in-sitemap', label: 'URLs in Sitemap', where: IN_SITEMAP },
    { slug: 'not-in-sitemap', label: 'URLs not in Sitemap', where: `u.kind = 'html' AND u.is_sitemap = 0 AND NOT ${IN_SITEMAP}`, issue: issue('Opportunity', 'Low', 'Indexable pages found by crawling that no XML sitemap lists.', 'Add important pages to the XML sitemap.') },
    { slug: 'orphan-urls', label: 'Orphan URLs', where: `${IN_SITEMAP} AND u.unique_inlinks = 0`, issue: issue('Warning', 'High', 'URLs in a sitemap that no internal link points to.', 'Link to these pages from the site, or remove them from the sitemap.') },
    { slug: 'non-indexable-in-sitemap', label: 'Non-Indexable URLs in Sitemap', where: `${IN_SITEMAP} AND u.indexability = 'Non-Indexable'`, issue: issue('Issue', 'High', 'Sitemap URLs that are not indexable, for example redirects, errors or noindex pages.', 'List only indexable 200 URLs in sitemaps.') },
    { slug: 'in-multiple-sitemaps', label: 'URLs in Multiple Sitemaps', where: '(SELECT count(*) FROM sitemap_entries e WHERE e.url_id = u.id) > 1', issue: issue('Warning', 'Low', 'URLs listed in more than one sitemap.', 'List each URL in one sitemap only.') },
    { slug: 'over-50k-urls', label: 'XML Sitemap with over 50k URLs', where: `u.is_sitemap = 1 AND u.sitemap_url_count > ${MAX_SITEMAP_URLS}`, issue: issue('Issue', 'High', 'Sitemap files with more URLs than the protocol limit.', 'Split the sitemap and use a sitemap index.') },
    { slug: 'over-50mb', label: 'XML Sitemap over 50MB', where: `u.is_sitemap = 1 AND u.size > ${MAX_SITEMAP_BYTES}`, issue: issue('Issue', 'High', 'Sitemap files larger than the protocol size limit.', 'Split the sitemap into smaller files.') }
  ]
)
