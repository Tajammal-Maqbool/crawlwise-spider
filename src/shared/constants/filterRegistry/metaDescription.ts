import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX, duplicateOf } from './bases'
import { issue } from './issue'

export const metaDescriptionTab = defineTab(
  {
    key: 'meta-description',
    label: 'Meta Description',
    group: 'On-page',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'meta_description_count', 'meta_description_1', 'meta_description_1_length', 'meta_description_1_pixel_width']
  },
  [
    { slug: 'missing', label: 'Missing', where: "coalesce(u.meta_description, '') = ''", issue: issue('Opportunity', 'Low', 'Pages with no meta description or an empty one.', 'Write a unique meta description that summarises the page.') },
    { slug: 'duplicate', label: 'Duplicate', where: duplicateOf('meta_description', INTERNAL_HTML_2XX), issue: issue('Opportunity', 'Low', 'Pages that share the same meta description.', 'Write a unique meta description for each page.') },
    { slug: 'over-characters', label: (t) => `Over ${t.metaDescriptionMaxChars} Characters`, where: (t) => `u.meta_description_len > ${t.metaDescriptionMaxChars}`, issue: issue('Opportunity', 'Low', 'Meta descriptions longer than the configured character limit.', 'Shorten the meta description.') },
    { slug: 'below-characters', label: (t) => `Below ${t.metaDescriptionMinChars} Characters`, where: (t) => `u.meta_description_len > 0 AND u.meta_description_len < ${t.metaDescriptionMinChars}`, issue: issue('Opportunity', 'Low', 'Meta descriptions shorter than the configured character limit.', 'Make the meta description more descriptive.') },
    { slug: 'over-pixels', label: (t) => `Over ${t.metaDescriptionMaxPixels} Pixels`, where: (t) => `u.meta_description_px > ${t.metaDescriptionMaxPixels}`, issue: issue('Opportunity', 'Low', 'Meta descriptions wider than the SERP pixel limit.', 'Shorten the meta description.') },
    { slug: 'below-pixels', label: (t) => `Below ${t.metaDescriptionMinPixels} Pixels`, where: (t) => `u.meta_description_px > 0 AND u.meta_description_px < ${t.metaDescriptionMinPixels}`, issue: issue('Opportunity', 'Low', 'Meta descriptions narrower than the configured pixel limit.', 'Use the available space for a fuller description.') },
    { slug: 'multiple', label: 'Multiple', where: 'u.meta_description_count > 1', issue: issue('Issue', 'Medium', 'Pages with more than one meta description.', 'Keep exactly one meta description per page.') },
    { slug: 'outside-head', label: 'Outside <head>', where: 'u.meta_description_outside_head = 1', issue: issue('Issue', 'High', 'Pages with a meta description outside the <head> element.', 'Move the meta description into the <head>.') }
  ]
)
