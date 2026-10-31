import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX, duplicateOf } from './bases'
import { issue } from './issue'

export const h1Tab = defineTab(
  {
    key: 'h1',
    label: 'H1',
    group: 'On-page',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'h1_count', 'h1_1', 'h1_1_length', 'h1_2', 'h1_2_length']
  },
  [
    { slug: 'missing', label: 'Missing', where: 'u.h1_count = 0', issue: issue('Issue', 'Medium', 'Pages with no H1 heading.', 'Add one descriptive H1 to each page.') },
    { slug: 'duplicate', label: 'Duplicate', where: duplicateOf('h1_1', INTERNAL_HTML_2XX), issue: issue('Opportunity', 'Low', 'Pages that share the same H1.', 'Write a unique H1 for each page.') },
    { slug: 'over-characters', label: (t) => `Over ${t.h1MaxChars} Characters`, where: (t) => `u.h1_1_len > ${t.h1MaxChars}`, issue: issue('Opportunity', 'Low', 'H1 headings longer than the configured limit.', 'Write a shorter, more focused H1.') },
    { slug: 'multiple', label: 'Multiple', where: 'u.h1_count > 1', issue: issue('Warning', 'Medium', 'Pages with more than one H1.', 'Use one H1, and use H2 to H6 for the other headings.') },
    { slug: 'alt-text-in-h1', label: 'Alt Text in H1', where: 'u.h1_alt_text = 1', issue: issue('Warning', 'Low', 'Pages where the H1 text comes only from the alt text of an image.', 'Use real text in the H1.') },
    { slug: 'non-sequential', label: 'Non-Sequential', where: 'u.h1_non_sequential = 1', issue: issue('Warning', 'Low', 'Pages where the first heading is not an H1.', 'Put the H1 first, then nest the lower headings in order.') }
  ]
)

export const h2Tab = defineTab(
  {
    key: 'h2',
    label: 'H2',
    group: 'On-page',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'h2_count', 'h2_1', 'h2_1_length', 'h2_2', 'h2_2_length']
  },
  [
    { slug: 'missing', label: 'Missing', where: 'u.h2_count = 0', issue: issue('Warning', 'Low', 'Pages with no H2 heading.', 'Use H2 headings to structure the content.') },
    { slug: 'duplicate', label: 'Duplicate', where: duplicateOf('h2_1', INTERNAL_HTML_2XX), issue: issue('Opportunity', 'Low', 'Pages that share the same first H2.', 'Write unique H2 headings.') },
    { slug: 'over-characters', label: (t) => `Over ${t.h2MaxChars} Characters`, where: (t) => `u.h2_1_len > ${t.h2MaxChars}`, issue: issue('Opportunity', 'Low', 'H2 headings longer than the configured limit.', 'Write shorter H2 headings.') },
    { slug: 'multiple', label: 'Multiple', where: 'u.h2_count > 1', issue: issue('Warning', 'Low', 'Pages with more than one H2. This is often fine.', 'Check that the heading structure is logical.') },
    { slug: 'non-sequential', label: 'Non-Sequential', where: 'u.h2_non_sequential = 1', issue: issue('Warning', 'Low', 'Pages where an H2 skips a heading level, for example an H2 before the H1.', 'Use headings in order.') }
  ]
)
