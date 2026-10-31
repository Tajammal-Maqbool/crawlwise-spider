import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX } from './bases'
import { issue } from './issue'

const R = 'u.rendered = 1'
const onlyRendered = (raw: string, cur: string) => `${R} AND coalesce(u.${raw}, '') = '' AND coalesce(u.${cur}, '') <> ''`
const updated = (raw: string, cur: string) => `${R} AND coalesce(u.${raw}, '') <> '' AND coalesce(u.${cur}, '') <> coalesce(u.${raw}, '')`
const ROBOTS = "lower(coalesce(u.meta_robots, ''))"
const RAW_ROBOTS = "lower(coalesce(u.raw_meta_robots, ''))"

export const javascriptTab = defineTab(
  {
    key: 'javascript',
    label: 'JavaScript',
    group: 'Technical',
    description: 'Internal HTML pages with a 2xx response (needs JavaScript rendering)',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'title_1', 'raw_title', 'h1_1', 'raw_h1', 'word_count', 'raw_word_count', 'js_link_count', 'js_errors', 'js_warnings', 'blocked_resources', 'js_messages']
  },
  [
    { slug: 'title-only-rendered', label: 'Page Title Only in Rendered HTML', where: onlyRendered('raw_title', 'title'), issue: issue('Warning', 'Medium', 'Pages whose title exists only after JavaScript runs.', 'Put the title in the server HTML.') },
    { slug: 'title-updated', label: 'Page Title Updated by JavaScript', where: updated('raw_title', 'title'), issue: issue('Warning', 'Medium', 'Pages where JavaScript changes the title.', 'Serve the final title in the server HTML.') },
    { slug: 'h1-only-rendered', label: 'H1 Only in Rendered HTML', where: onlyRendered('raw_h1', 'h1_1'), issue: issue('Warning', 'Medium', 'Pages whose H1 exists only after JavaScript runs.', 'Put the H1 in the server HTML.') },
    { slug: 'h1-updated', label: 'H1 Updated by JavaScript', where: updated('raw_h1', 'h1_1'), issue: issue('Warning', 'Low', 'Pages where JavaScript changes the H1.', 'Serve the final H1 in the server HTML.') },
    { slug: 'description-only-rendered', label: 'Meta Description Only in Rendered HTML', where: onlyRendered('raw_meta_description', 'meta_description'), issue: issue('Warning', 'Low', 'Pages whose meta description exists only after JavaScript runs.', 'Put the meta description in the server HTML.') },
    { slug: 'description-updated', label: 'Meta Description Updated by JavaScript', where: updated('raw_meta_description', 'meta_description'), issue: issue('Warning', 'Low', 'Pages where JavaScript changes the meta description.', 'Serve the final description in the server HTML.') },
    { slug: 'canonical-only-rendered', label: 'Canonical Only in Rendered HTML', where: onlyRendered('raw_canonical', 'canonical'), issue: issue('Warning', 'High', 'Pages whose canonical exists only after JavaScript runs.', 'Put the canonical in the server HTML.') },
    { slug: 'canonical-mismatch', label: 'Canonical Mismatch', where: `${R} AND u.raw_canonical IS NOT NULL AND u.canonical IS NOT NULL AND u.raw_canonical <> u.canonical`, issue: issue('Issue', 'High', 'Pages where the raw and rendered canonicals differ.', 'Use one canonical in both versions.') },
    { slug: 'noindex-only-original', label: 'Noindex Only in Original HTML', where: `${R} AND ${RAW_ROBOTS} LIKE '%noindex%' AND ${ROBOTS} NOT LIKE '%noindex%'`, issue: issue('Issue', 'High', 'Pages with noindex in the server HTML that JavaScript removes. Search engines may not index them.', 'Remove noindex from the server HTML if the page must be indexed.') },
    { slug: 'nofollow-only-original', label: 'Nofollow Only in Original HTML', where: `${R} AND ${RAW_ROBOTS} LIKE '%nofollow%' AND ${ROBOTS} NOT LIKE '%nofollow%'`, issue: issue('Issue', 'High', 'Pages with nofollow in the server HTML that JavaScript removes.', 'Make the server HTML directive match the intent.') },
    { slug: 'contains-js-links', label: 'Contains JavaScript Links', where: `${R} AND u.js_link_count > 0`, issue: issue('Warning', 'Low', 'Pages with links that only exist after JavaScript runs.', 'Put important links in the server HTML.') },
    { slug: 'contains-js-content', label: 'Contains JavaScript Content', where: `${R} AND coalesce(u.word_count, 0) > coalesce(u.raw_word_count, 0)`, issue: issue('Warning', 'Low', 'Pages where JavaScript adds text content.', 'Serve important content in the server HTML.') },
    { slug: 'blocked-resources', label: 'Pages with Blocked Resources', where: `${R} AND u.blocked_resources > 0`, issue: issue('Warning', 'Medium', 'Pages where resources failed to load during rendering.', 'Fix or unblock the failed resources.') },
    { slug: 'js-errors', label: 'Pages with JavaScript Errors', where: `${R} AND u.js_errors > 0`, issue: issue('Warning', 'Medium', 'Pages that log JavaScript errors while rendering.', 'Fix the script errors shown in the console.') },
    { slug: 'js-warnings', label: 'Pages with JavaScript Warnings', where: `${R} AND u.js_warnings > 0` }
  ]
)
