import { defineTab } from './defineTab'
import { INTERNAL_2XX } from './bases'
import { issue } from './issue'

const HTML = "u.kind = 'html'"
const LARGE_BYTES = 15 * 1024 * 1024

export const validationTab = defineTab(
  {
    key: 'validation',
    label: 'Validation',
    group: 'Technical',
    description: 'Internal URLs with a 2xx response',
    baseWhere: INTERNAL_2XX(),
    columns: ['address', 'content_type', 'size', 'head_count', 'body_count', 'indexability']
  },
  [
    { slug: 'invalid-head-elements', label: 'Invalid HTML Elements in <head>', where: `${HTML} AND u.invalid_head_elements = 1`, issue: issue('Issue', 'High', 'Pages with elements in the <head> that end it early, so later head tags can be ignored.', 'Keep only metadata elements in the <head>.') },
    { slug: 'head-not-first', label: '<head> Not First In <html> Element', where: `${HTML} AND u.head_not_first = 1`, issue: issue('Issue', 'High', 'Pages where another element comes before the <head>.', 'Make <head> the first element inside <html>.') },
    { slug: 'missing-head', label: 'Missing <head> Tag', where: `${HTML} AND u.head_count = 0`, issue: issue('Issue', 'High', 'Pages without a <head> tag.', 'Add a <head> element.') },
    { slug: 'multiple-head', label: 'Multiple <head> Tags', where: `${HTML} AND u.head_count > 1`, issue: issue('Issue', 'High', 'Pages with more than one <head> tag.', 'Keep one <head> element.') },
    { slug: 'missing-body', label: 'Missing <body> Tag', where: `${HTML} AND u.body_count = 0`, issue: issue('Issue', 'High', 'Pages without a <body> tag.', 'Add a <body> element.') },
    { slug: 'multiple-body', label: 'Multiple <body> Tags', where: `${HTML} AND u.body_count > 1`, issue: issue('Issue', 'High', 'Pages with more than one <body> tag.', 'Keep one <body> element.') },
    { slug: 'html-over-15mb', label: 'HTML Document Over 15MB', where: `${HTML} AND u.size > ${LARGE_BYTES}`, issue: issue('Issue', 'High', 'HTML documents larger than 15MB. Search engines may stop reading them.', 'Reduce the document size.') },
    { slug: 'resource-over-15mb', label: 'Resource Over 15MB', where: `u.kind <> 'html' AND u.size > ${LARGE_BYTES}`, issue: issue('Warning', 'Medium', 'Resources larger than 15MB.', 'Compress or split large resources.') },
    { slug: 'body-before-html', label: '<body> Element Preceding <html>', where: `${HTML} AND u.body_before_html = 1`, issue: issue('Issue', 'High', 'Pages with a <body> tag before the <html> tag.', 'Fix the document structure.') }
  ]
)
