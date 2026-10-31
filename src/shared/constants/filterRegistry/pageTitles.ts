import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX, duplicateOf } from './bases'
import { issue } from './issue'

export const pageTitlesTab = defineTab(
  {
    key: 'page-titles',
    label: 'Page Titles',
    group: 'On-page',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'title_count', 'title_1', 'title_1_length', 'title_1_pixel_width']
  },
  [
    { slug: 'missing', label: 'Missing', where: "coalesce(u.title, '') = ''", issue: issue('Issue', 'High', 'Pages with no page title or an empty title element.', 'Add a unique, descriptive title to every page.') },
    { slug: 'duplicate', label: 'Duplicate', where: duplicateOf('title', INTERNAL_HTML_2XX), issue: issue('Opportunity', 'Medium', 'Pages that share the same page title.', 'Write a unique title for each page.') },
    { slug: 'over-characters', label: (t) => `Over ${t.titleMaxChars} Characters`, where: (t) => `u.title_len > ${t.titleMaxChars}`, issue: issue('Opportunity', 'Medium', 'Page titles longer than the configured character limit. Search engines can truncate them.', 'Shorten the title and keep the important words first.') },
    { slug: 'below-characters', label: (t) => `Below ${t.titleMinChars} Characters`, where: (t) => `u.title_len > 0 AND u.title_len < ${t.titleMinChars}`, issue: issue('Opportunity', 'Medium', 'Page titles shorter than the configured character limit.', 'Make the title more descriptive.') },
    { slug: 'over-pixels', label: (t) => `Over ${t.titleMaxPixels} Pixels`, where: (t) => `u.title_px > ${t.titleMaxPixels}`, issue: issue('Opportunity', 'Medium', 'Page titles wider than the SERP pixel limit. Search engines can truncate them.', 'Shorten the title.') },
    { slug: 'below-pixels', label: (t) => `Below ${t.titleMinPixels} Pixels`, where: (t) => `u.title_px > 0 AND u.title_px < ${t.titleMinPixels}`, issue: issue('Opportunity', 'Low', 'Page titles narrower than the configured pixel limit.', 'Use the available space for a more descriptive title.') },
    { slug: 'same-as-h1', label: 'Same as H1', where: "coalesce(u.title, '') <> '' AND lower(trim(u.title)) = lower(trim(u.h1_1))", issue: issue('Opportunity', 'Low', 'Page titles that are the same as the H1.', 'Consider a different title to target more search terms.') },
    { slug: 'multiple', label: 'Multiple', where: 'u.title_count > 1', issue: issue('Issue', 'Medium', 'Pages with more than one title element.', 'Keep exactly one title element per page.') },
    { slug: 'outside-head', label: 'Outside <head>', where: 'u.title_outside_head = 1', issue: issue('Issue', 'High', 'Pages with a title element outside the <head> element.', 'Move the title element into the <head>.') }
  ]
)
