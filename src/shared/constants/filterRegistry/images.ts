import { defineTab } from './defineTab'
import { IMAGES_2XX } from './bases'
import { issue } from './issue'

const IMG_LINK = "SELECT 1 FROM links l WHERE l.dst_id = u.id AND l.type = 'Image'"

export const imagesTab = defineTab(
  {
    key: 'images',
    label: 'Images',
    group: 'On-page',
    description: 'Images with a 2xx response',
    baseWhere: IMAGES_2XX(),
    columns: ['address', 'content_type', 'size', 'img_inlinks', 'alt_text', 'indexability', 'indexability_status']
  },
  [
    { slug: 'over-kb', label: (t) => `Over ${t.imageMaxKb} KB`, where: (t) => `u.size > ${t.imageMaxKb * 1024}`, issue: issue('Opportunity', 'Medium', 'Images larger than the configured size limit. Large images slow the page.', 'Compress or resize the images, or use a modern format such as WebP or AVIF.') },
    { slug: 'missing-alt-text', label: 'Missing Alt Text', where: `EXISTS (${IMG_LINK} AND l.alt = '')`, issue: issue('Issue', 'Low', 'Images with an empty alt attribute.', 'Write alt text that describes the image. Leave it empty only for decorative images.') },
    { slug: 'missing-alt-attribute', label: 'Missing Alt Attribute', where: `EXISTS (${IMG_LINK} AND l.alt IS NULL)`, issue: issue('Issue', 'Low', 'Images with no alt attribute.', 'Add an alt attribute to every image.') },
    { slug: 'alt-text-over-characters', label: (t) => `Alt Text Over ${t.altTextMaxChars} Characters`, where: (t) => `EXISTS (${IMG_LINK} AND length(l.alt) > ${t.altTextMaxChars})`, issue: issue('Opportunity', 'Low', 'Images with alt text longer than the configured limit.', 'Write shorter alt text.') },
    { slug: 'missing-size-attributes', label: 'Missing Size Attributes', where: `EXISTS (${IMG_LINK} AND l.has_dimensions = 0)`, issue: issue('Opportunity', 'Low', 'Images without width and height attributes. This can cause layout shift.', 'Add width and height attributes to the img element.') }
  ]
)
