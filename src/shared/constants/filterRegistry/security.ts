import { defineTab } from './defineTab'
import { DONE } from './bases'
import { issue } from './issue'

const HTML_INTERNAL_2XX = "u.is_internal = 1 AND u.kind = 'html' AND u.status_code BETWEEN 200 AND 299"
const HTTPS_HTML = `${HTML_INTERNAL_2XX} AND u.scheme = 'https'`

export const securityTab = defineTab(
  {
    key: 'security',
    label: 'Security',
    group: 'Technical',
    description: 'All internal URLs and non-HTML external URLs',
    baseWhere: `${DONE()} AND (u.is_internal = 1 OR coalesce(u.kind, '') <> 'html')`,
    columns: ['address', 'content_type', 'status_code', 'status', 'indexability', 'indexability_status', 'referrer_policy']
  },
  [
    { slug: 'http-urls', label: 'HTTP URLs', where: "u.is_internal = 1 AND u.scheme = 'http'", issue: issue('Issue', 'High', 'Internal URLs served over HTTP, which is not secure.', 'Move the site to HTTPS, redirect HTTP to HTTPS and update internal links.') },
    { slug: 'https-urls', label: 'HTTPS URLs', where: "u.scheme = 'https'" },
    { slug: 'mixed-content', label: 'Mixed Content', where: `${HTTPS_HTML} AND u.mixed_content = 1`, issue: issue('Issue', 'High', 'HTTPS pages that load resources such as images, scripts or CSS over HTTP.', 'Load every resource over HTTPS.') },
    { slug: 'form-url-insecure', label: 'Form URL Insecure', where: `${HTTPS_HTML} AND u.insecure_form_action = 1`, issue: issue('Issue', 'High', 'HTTPS pages with a form that posts to an HTTP URL.', 'Change the form action to an HTTPS URL.') },
    { slug: 'form-on-http-url', label: 'Form on HTTP URL', where: `${HTML_INTERNAL_2XX} AND u.scheme = 'http' AND u.form_on_http = 1`, issue: issue('Issue', 'High', 'Pages served over HTTP that contain a form.', 'Serve pages with forms over HTTPS.') },
    { slug: 'unsafe-cross-origin-links', label: 'Unsafe Cross-Origin Links', where: `${HTML_INTERNAL_2XX} AND u.unsafe_cross_origin = 1`, issue: issue('Warning', 'Low', 'Pages that link to external sites with target="_blank" but without rel="noopener" or rel="noreferrer".', 'Add rel="noopener" to external links that open in a new tab.') },
    { slug: 'missing-hsts-header', label: 'Missing HSTS Header', where: `${HTTPS_HTML} AND u.hsts = 0`, issue: issue('Warning', 'Low', 'HTTPS pages without a Strict-Transport-Security header.', 'Add the Strict-Transport-Security response header.') },
    { slug: 'bad-content-type', label: 'Bad Content Type', where: 'u.is_internal = 1 AND u.bad_content_type = 1', issue: issue('Warning', 'Low', 'URLs whose Content-Type header does not match the content.', 'Send the correct Content-Type header.') },
    { slug: 'missing-x-content-type-options', label: 'Missing X-Content-Type-Options Header', where: `${HTML_INTERNAL_2XX} AND u.x_content_type_options = 0`, issue: issue('Warning', 'Low', 'Pages without the X-Content-Type-Options: nosniff header.', 'Add the header X-Content-Type-Options: nosniff.') },
    { slug: 'missing-x-frame-options', label: 'Missing X-Frame-Options Header', where: `${HTML_INTERNAL_2XX} AND u.x_frame_options = 0`, issue: issue('Warning', 'Low', 'Pages without an X-Frame-Options header, which protects against clickjacking.', 'Add X-Frame-Options: SAMEORIGIN or a CSP frame-ancestors rule.') },
    { slug: 'protocol-relative-resource-links', label: 'Protocol-Relative Resource Links', where: `${HTML_INTERNAL_2XX} AND u.protocol_relative_links = 1`, issue: issue('Warning', 'Low', 'Pages that load resources with protocol-relative URLs (starting with //).', 'Use absolute HTTPS URLs for resources.') },
    { slug: 'missing-csp', label: 'Missing Content-Security-Policy Header', where: `${HTML_INTERNAL_2XX} AND u.csp = 0`, issue: issue('Warning', 'Low', 'Pages without a Content-Security-Policy header.', 'Add a Content-Security-Policy header.') },
    { slug: 'missing-secure-referrer-policy', label: 'Missing Secure Referrer-Policy Header', where: `${HTML_INTERNAL_2XX} AND (u.referrer_policy IS NULL OR lower(u.referrer_policy) IN ('unsafe-url', 'no-referrer-when-downgrade'))`, issue: issue('Warning', 'Low', 'Pages without a secure Referrer-Policy header.', 'Add Referrer-Policy: strict-origin-when-cross-origin or a stricter value.') }
  ]
)
