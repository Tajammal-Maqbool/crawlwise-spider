import { defineTab } from './defineTab'
import { INTERNAL_2XX, ROBOTS_TEXT } from './bases'
import { issue } from './issue'

const has = (token: string) => `${ROBOTS_TEXT} LIKE '%${token}%'`

export const directivesTab = defineTab(
  {
    key: 'directives',
    label: 'Directives',
    group: 'Technical',
    description: 'Internal URLs with a 2xx response',
    baseWhere: INTERNAL_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'meta_robots_1', 'x_robots_tag_1', 'meta_refresh_1', 'canonical_link_element_1']
  },
  [
    { slug: 'index', label: 'Index', where: `NOT ${has('noindex')} AND NOT ${has('none')}` },
    { slug: 'noindex', label: 'Noindex', where: has('noindex'), issue: issue('Warning', 'High', 'URLs with a noindex directive. Search engines will not index them.', 'Remove noindex from pages that must be indexed.') },
    { slug: 'follow', label: 'Follow', where: `NOT ${has('nofollow')} AND NOT ${has('none')}` },
    { slug: 'nofollow', label: 'Nofollow', where: has('nofollow'), issue: issue('Warning', 'High', 'URLs with a nofollow directive. Search engines will not follow their links.', 'Remove nofollow if the links must be followed.') },
    { slug: 'none', label: 'None', where: has('none'), issue: issue('Warning', 'High', 'URLs with the none directive (noindex and nofollow).', 'Remove the directive from pages that must be indexed.') },
    { slug: 'noarchive', label: 'NoArchive', where: has('noarchive') },
    { slug: 'nosnippet', label: 'NoSnippet', where: has('nosnippet') },
    { slug: 'max-snippet', label: 'Max-Snippet', where: has('max-snippet') },
    { slug: 'max-image-preview', label: 'Max-Image-Preview', where: has('max-image-preview') },
    { slug: 'max-video-preview', label: 'Max-Video-Preview', where: has('max-video-preview') },
    { slug: 'noodp', label: 'NoODP', where: has('noodp') },
    { slug: 'noydir', label: 'NoYDIR', where: has('noydir') },
    { slug: 'noimageindex', label: 'NoImageIndex', where: has('noimageindex') },
    { slug: 'notranslate', label: 'NoTranslate', where: has('notranslate') },
    { slug: 'unavailable-after', label: 'Unavailable_After', where: has('unavailable_after') },
    { slug: 'refresh', label: 'Refresh', where: 'u.meta_refresh IS NOT NULL' },
    { slug: 'outside-head', label: 'Outside <head>', where: 'u.meta_robots_outside_head = 1', issue: issue('Issue', 'High', 'Pages with a meta robots tag outside the <head>.', 'Move the meta robots tag into the <head>.') }
  ]
)
