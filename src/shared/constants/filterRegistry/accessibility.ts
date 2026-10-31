import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX } from './bases'
import { issue } from './issue'

const tagged = (tag: string) => `EXISTS (SELECT 1 FROM accessibility a WHERE a.url_id = u.id AND a.tags LIKE '%,${tag},%')`

export const accessibilityTab = defineTab(
  {
    key: 'accessibility',
    label: 'Accessibility',
    group: 'Technical',
    description: 'Internal HTML pages checked with axe-core (needs JavaScript rendering with accessibility on)',
    baseWhere: `${INTERNAL_HTML_2XX()} AND u.a11y_checked = 1`,
    columns: ['address', 'indexability', 'a11y_violations', 'a11y_rules']
  },
  [
    { slug: 'wcag20-a', label: 'WCAG 2.0 A Violation', where: tagged('wcag2a'), issue: issue('Issue', 'High', 'Pages that fail WCAG 2.0 level A rules.', 'Fix the failing rules listed for each page.') },
    { slug: 'wcag20-aa', label: 'WCAG 2.0 AA Violation', where: tagged('wcag2aa'), issue: issue('Issue', 'Medium', 'Pages that fail WCAG 2.0 level AA rules.', 'Fix the failing rules listed for each page.') },
    { slug: 'wcag20-aaa', label: 'WCAG 2.0 AAA Violation', where: tagged('wcag2aaa'), issue: issue('Warning', 'Low', 'Pages that fail WCAG 2.0 level AAA rules.', 'Review the failing rules.') },
    { slug: 'wcag21-aa', label: 'WCAG 2.1 AA Violation', where: tagged('wcag21aa'), issue: issue('Issue', 'Medium', 'Pages that fail WCAG 2.1 level AA rules.', 'Fix the failing rules listed for each page.') },
    { slug: 'wcag22-aa', label: 'WCAG 2.2 AA Violation', where: tagged('wcag22aa'), issue: issue('Issue', 'Medium', 'Pages that fail WCAG 2.2 level AA rules.', 'Fix the failing rules listed for each page.') },
    { slug: 'best-practice', label: 'Best Practice Violation', where: tagged('best-practice'), issue: issue('Warning', 'Low', 'Pages that fail accessibility best practice rules.', 'Review the failing rules.') },
    { slug: 'critical', label: 'Critical Impact', where: "EXISTS (SELECT 1 FROM accessibility a WHERE a.url_id = u.id AND a.impact = 'critical')" },
    { slug: 'no-violations', label: 'No Violations', where: 'u.a11y_violations = 0' }
  ]
)
