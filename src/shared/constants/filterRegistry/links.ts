import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX } from './bases'
import { issue } from './issue'

export const linksTab = defineTab(
  {
    key: 'links',
    label: 'Links',
    group: 'Links',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'crawl_depth', 'inlinks', 'unique_inlinks', 'outlinks', 'unique_outlinks', 'external_outlinks', 'unique_external_outlinks']
  },
  [
    { slug: 'pages-without-internal-outlinks', label: 'Pages Without Internal Outlinks', where: 'u.unique_outlinks = 0', issue: issue('Warning', 'High', 'Pages with no links to other internal pages.', 'Add relevant internal links.') },
    { slug: 'internal-nofollow-outlinks', label: 'Internal Nofollow Outlinks', where: 'u.nofollow_outlinks > 0', issue: issue('Warning', 'Low', 'Pages that link to internal URLs with rel="nofollow".', 'Remove nofollow from internal links.') },
    { slug: 'internal-outlinks-no-anchor', label: 'Internal Outlinks With No Anchor Text', where: 'u.no_anchor_outlinks > 0', issue: issue('Warning', 'Low', 'Pages with internal links that have no anchor text.', 'Add descriptive anchor text, or alt text for image links.') },
    { slug: 'non-descriptive-anchor', label: 'Non-Descriptive Anchor Text In Internal Outlinks', where: 'u.non_descriptive_outlinks > 0', issue: issue('Opportunity', 'Low', "Pages with internal links that use generic anchor text such as 'click here'.", 'Use anchor text that describes the target page.') },
    { slug: 'high-external-outlinks', label: 'Pages With High External Outlinks', where: (t) => `u.unique_external_outlinks > ${t.highExternalOutlinks}`, issue: issue('Warning', 'Low', 'Pages with more unique external links than the configured limit.', 'Check that the external links are useful.') },
    { slug: 'high-internal-outlinks', label: 'Pages With High Internal Outlinks', where: (t) => `u.unique_outlinks > ${t.highInternalOutlinks}`, issue: issue('Warning', 'Low', 'Pages with more unique internal links than the configured limit.', 'Reduce the links to the most important ones.') },
    { slug: 'follow-nofollow-inlinks', label: 'Follow & Nofollow Internal Inlinks To Page', where: 'u.follow_inlinks > 0 AND u.nofollow_inlinks > 0', issue: issue('Warning', 'Low', 'Pages that get both follow and nofollow internal links.', 'Use the same link type for all internal links to the page.') },
    { slug: 'nofollow-inlinks-only', label: 'Internal Nofollow Inlinks Only', where: 'u.follow_inlinks = 0 AND u.nofollow_inlinks > 0', issue: issue('Warning', 'High', 'Pages that get only nofollow internal links.', 'Add followed internal links to the page.') },
    { slug: 'high-crawl-depth', label: 'Pages With High Crawl Depth', where: (t) => `u.depth > ${t.highCrawlDepth}`, issue: issue('Opportunity', 'Medium', 'Pages that are more clicks from the start page than the configured limit.', 'Link to deep pages from higher-level pages.') },
    { slug: 'outlinks-to-localhost', label: 'Outlinks To Localhost', where: 'u.localhost_outlinks > 0', issue: issue('Issue', 'High', 'Pages with links to localhost or 127.0.0.1.', 'Replace development links with live URLs.') },
    { slug: 'non-indexable-page-inlinks-only', label: 'Non-Indexable Page Inlinks Only', where: 'u.unique_inlinks > 0 AND u.indexable_inlinks = 0', issue: issue('Warning', 'Medium', 'Pages that get links only from non-indexable pages.', 'Link to the page from indexable pages.') }
  ]
)
