import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX, duplicateOf } from './bases'
import { issue } from './issue'

export const contentTab = defineTab(
  {
    key: 'content',
    label: 'Content',
    group: 'On-page',
    description: 'Internal HTML pages with a 2xx response',
    baseWhere: INTERNAL_HTML_2XX(),
    columns: ['address', 'indexability', 'indexability_status', 'word_count', 'sentence_count', 'flesch_score', 'near_duplicate_count', 'closest_similarity', 'closest_similar_url', 'text_ratio', 'hash', 'size']
  },
  [
    { slug: 'exact-duplicates', label: 'Exact Duplicates', where: duplicateOf('hash', INTERNAL_HTML_2XX), issue: issue('Opportunity', 'Medium', 'Pages with identical HTML (same MD5 hash) as another page.', 'Remove the duplicate, redirect it, or canonicalise it to the main version.') },
    { slug: 'low-content-pages', label: 'Low Content Pages', where: (t) => `coalesce(u.word_count, 0) < ${t.lowContentWords}`, issue: issue('Opportunity', 'Medium', 'Pages with fewer words than the configured limit.', 'Add useful content, or noindex thin pages.') },
    { slug: 'near-duplicates', label: 'Near Duplicates', where: 'u.near_duplicate_count > 0', issue: issue('Opportunity', 'Medium', 'Pages whose text is very similar to another page, above the configured similarity threshold.', 'Merge, differentiate or canonicalise similar pages.') },
    { slug: 'readability-difficult', label: 'Readability Difficult', where: 'u.flesch_score >= 10 AND u.flesch_score < 50', issue: issue('Opportunity', 'Low', 'Pages with a Flesch reading ease score below 50.', 'Use shorter sentences and simpler words.') },
    { slug: 'readability-very-difficult', label: 'Readability Very Difficult', where: 'u.flesch_score < 10', issue: issue('Opportunity', 'Low', 'Pages with a Flesch reading ease score below 10.', 'Rewrite the text in plainer language.') },
    { slug: 'soft-404', label: 'Soft 404 Pages', where: 'u.soft_404 = 1', issue: issue('Warning', 'High', "Pages that return 200 but look like an error page, for example a 'not found' title.", 'Return a real 404 or 410 status for missing pages.') },
    { slug: 'lorem-ipsum', label: 'Lorem Ipsum Placeholder', where: 'u.lorem_ipsum = 1', issue: issue('Issue', 'Medium', "Pages that contain the placeholder text 'lorem ipsum'.", 'Replace the placeholder text with real content.') }
  ]
)
