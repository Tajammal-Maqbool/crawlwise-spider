import { defineTab, type FilterSpec } from './defineTab'
import { EXTERNAL, INTERNAL } from './bases'

const KIND_FILTERS: FilterSpec[] = [
  { slug: 'html', label: 'HTML', where: "u.kind = 'html'" },
  { slug: 'javascript', label: 'JavaScript', where: "u.kind = 'javascript'" },
  { slug: 'css', label: 'CSS', where: "u.kind = 'css'" },
  { slug: 'images', label: 'Images', where: "u.kind = 'image'" },
  { slug: 'media', label: 'Media', where: "u.kind = 'media'" },
  { slug: 'fonts', label: 'Fonts', where: "u.kind = 'font'" },
  { slug: 'xml', label: 'XML', where: "u.kind = 'xml'" },
  { slug: 'pdf', label: 'PDF', where: "u.kind = 'pdf'" },
  { slug: 'plugins', label: 'Plugins', where: "u.kind = 'plugin'" },
  { slug: 'other', label: 'Other', where: "u.kind = 'other'" },
  { slug: 'unknown', label: 'Unknown', where: "coalesce(u.kind, 'unknown') = 'unknown'" }
]

const INTERNAL_COLUMNS = [
  'address', 'content_type', 'status_code', 'status', 'indexability', 'indexability_status',
  'title_1', 'title_1_length', 'title_1_pixel_width', 'meta_description_1', 'meta_description_1_length',
  'meta_description_1_pixel_width', 'meta_keywords_1', 'h1_1', 'h1_1_length', 'h1_2', 'h2_1', 'h2_2',
  'meta_robots_1', 'x_robots_tag_1', 'meta_refresh_1', 'canonical_link_element_1', 'rel_next_1', 'rel_prev_1',
  'size', 'transferred', 'word_count', 'text_ratio', 'crawl_depth', 'folder_depth', 'inlinks', 'unique_inlinks',
  'outlinks', 'unique_outlinks', 'external_outlinks', 'unique_external_outlinks', 'hash', 'response_time',
  'last_modified', 'redirect_url', 'redirect_type', 'url_length', 'http_version', 'language', 'crawl_timestamp'
]

export const internalTab = defineTab(
  { key: 'internal', label: 'Internal', group: 'Crawl', description: 'Internal URLs', baseWhere: INTERNAL(), columns: INTERNAL_COLUMNS },
  KIND_FILTERS
)

export const externalTab = defineTab(
  {
    key: 'external',
    label: 'External',
    group: 'Crawl',
    description: 'External URLs',
    baseWhere: EXTERNAL(),
    columns: ['address', 'content_type', 'status_code', 'status', 'crawl_depth', 'inlinks', 'response_time', 'size', 'redirect_url', 'crawl_timestamp']
  },
  KIND_FILTERS
)
