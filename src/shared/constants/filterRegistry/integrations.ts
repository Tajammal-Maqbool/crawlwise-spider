import { defineTab } from './defineTab'
import { INTERNAL_HTML_2XX } from './bases'
import { issue } from './issue'

export const AI_SLOTS = 5

const PSI_DONE = "u.psi_status = 'Success'"

export const pageSpeedTab = defineTab(
  {
    key: 'pagespeed',
    label: 'PageSpeed',
    group: 'Integrations',
    description: 'Internal HTML pages checked with PageSpeed Insights (needs PageSpeed enabled in API Access)',
    baseWhere: `${INTERNAL_HTML_2XX()} AND u.psi_status IS NOT NULL`,
    columns: ['address', 'psi_score', 'psi_lcp', 'psi_fcp', 'psi_tbt', 'psi_si', 'psi_cls', 'psi_crux', 'psi_status']
  },
  [
    { slug: 'good', label: 'Performance Score Good (90+)', where: `${PSI_DONE} AND u.psi_score >= 90` },
    { slug: 'needs-improvement', label: 'Performance Score Needs Improvement', where: `${PSI_DONE} AND u.psi_score >= 50 AND u.psi_score < 90`, issue: issue('Opportunity', 'Medium', 'Pages with a lab performance score from 50 to 89.', 'Review the Lighthouse opportunities for these pages.') },
    { slug: 'poor', label: 'Performance Score Poor', where: `${PSI_DONE} AND u.psi_score < 50`, issue: issue('Issue', 'High', 'Pages with a lab performance score below 50.', 'Reduce render-blocking resources, script work and large images.') },
    { slug: 'lcp-over', label: 'Largest Contentful Paint Over 2.5s', where: `${PSI_DONE} AND u.psi_lcp_ms > 2500`, issue: issue('Opportunity', 'High', 'Pages where the largest element paints after 2.5 seconds.', 'Speed up the server response and the main image or text block.') },
    { slug: 'cls-over', label: 'Cumulative Layout Shift Over 0.1', where: `${PSI_DONE} AND u.psi_cls > 0.1`, issue: issue('Opportunity', 'Medium', 'Pages whose layout shifts more than 0.1.', 'Reserve space for images, ads and embeds.') },
    { slug: 'tbt-over', label: 'Total Blocking Time Over 200ms', where: `${PSI_DONE} AND u.psi_tbt_ms > 200`, issue: issue('Opportunity', 'Medium', 'Pages where scripts block the main thread for more than 200 ms.', 'Split, defer or remove heavy JavaScript.') },
    { slug: 'request-error', label: 'Request Error', where: `u.psi_status <> 'Success'`, issue: issue('Warning', 'Low', 'Pages where the PageSpeed request failed.', 'Check the API key and quota, then run the crawl again.') }
  ]
)

export const aiTab = defineTab(
  {
    key: 'ai',
    label: 'AI',
    group: 'Integrations',
    description: 'Internal HTML pages with AI prompt results (needs AI enabled in API Access)',
    baseWhere: `${INTERNAL_HTML_2XX()} AND EXISTS (SELECT 1 FROM custom_values v WHERE v.url_id = u.id AND v.kind = 'ai')`,
    columns: ['address', ...Array.from({ length: AI_SLOTS }, (_, i) => `ai_prompt_${i}`)]
  },
  [
    ...Array.from({ length: AI_SLOTS }, (_, i) => ({
      slug: `prompt-${i + 1}`,
      label: `Prompt ${i + 1}`,
      where: `EXISTS (SELECT 1 FROM custom_values v WHERE v.url_id = u.id AND v.kind = 'ai' AND v.slot = ${i})`
    })),
    { slug: 'errors', label: 'Prompt Errors', where: "EXISTS (SELECT 1 FROM custom_values v WHERE v.url_id = u.id AND v.kind = 'ai' AND (v.value LIKE 'Error:%' OR v.value = 'Refused by the model'))" }
  ]
)
