import { defineTab } from './defineTab'
import { INTERNAL } from './bases'
import { issue } from './issue'

export const urlTab = defineTab(
  {
    key: 'url',
    label: 'URL',
    group: 'On-page',
    description: 'Internal URLs',
    baseWhere: INTERNAL(),
    columns: ['address', 'content_type', 'status_code', 'status', 'indexability', 'indexability_status', 'url_length', 'folder_depth']
  },
  [
    { slug: 'non-ascii', label: 'Non ASCII Characters', where: 'u.url_non_ascii = 1', issue: issue('Warning', 'Low', 'URLs with characters outside the ASCII set.', 'Use only ASCII characters in URLs, or encode them consistently.') },
    { slug: 'underscores', label: 'Underscores', where: 'u.url_underscores = 1', issue: issue('Opportunity', 'Low', 'URLs that use underscores to separate words.', 'Use hyphens instead of underscores.') },
    { slug: 'uppercase', label: 'Uppercase', where: 'u.url_uppercase = 1', issue: issue('Opportunity', 'Low', 'URLs with uppercase characters, which can cause duplicate URLs.', 'Use lowercase URLs.') },
    { slug: 'parameters', label: 'Parameters', where: 'u.url_parameters = 1', issue: issue('Warning', 'Low', 'URLs with query parameters.', 'Limit parameters, and use canonicals for parameter variants.') },
    { slug: 'over-characters', label: (t) => `Over ${t.urlMaxChars} Characters`, where: (t) => `u.url_len > ${t.urlMaxChars}`, issue: issue('Opportunity', 'Low', 'URLs longer than the configured limit.', 'Use shorter, descriptive URLs.') },
    { slug: 'multiple-slashes', label: 'Multiple Slashes', where: 'u.url_multiple_slashes = 1', issue: issue('Issue', 'Low', 'URLs with two or more slashes together in the path.', 'Fix the links so that the path has single slashes.') },
    { slug: 'repetitive-path', label: 'Repetitive Path', where: 'u.url_repetitive_path = 1', issue: issue('Opportunity', 'Low', 'URLs with a repeated path segment.', 'Check for relative link errors that repeat folders.') },
    { slug: 'contains-space', label: 'Contains Space', where: 'u.url_contains_space = 1', issue: issue('Warning', 'Low', 'URLs that contain a space.', 'Replace spaces with hyphens.') },
    { slug: 'internal-search', label: 'Internal Search', where: 'u.url_internal_search = 1', issue: issue('Warning', 'Low', 'URLs that look like internal search result pages.', 'Block internal search pages from crawling, or noindex them.') },
    { slug: 'ga-tracking-parameters', label: 'GA Tracking Parameters', where: 'u.url_ga_parameters = 1', issue: issue('Warning', 'Low', 'Internal URLs with Google Analytics tracking parameters.', 'Remove tracking parameters from internal links.') }
  ]
)
