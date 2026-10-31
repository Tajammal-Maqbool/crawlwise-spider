export const SCHEMA_VERSION = 2

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS urls (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  host TEXT NOT NULL,
  scheme TEXT NOT NULL,
  is_internal INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0,
  queue_seq INTEGER,
  depth INTEGER,
  folder_depth INTEGER,
  found_via TEXT,
  url_len INTEGER NOT NULL DEFAULT 0,
  url_non_ascii INTEGER NOT NULL DEFAULT 0,
  url_underscores INTEGER NOT NULL DEFAULT 0,
  url_uppercase INTEGER NOT NULL DEFAULT 0,
  url_parameters INTEGER NOT NULL DEFAULT 0,
  url_multiple_slashes INTEGER NOT NULL DEFAULT 0,
  url_repetitive_path INTEGER NOT NULL DEFAULT 0,
  url_contains_space INTEGER NOT NULL DEFAULT 0,
  url_internal_search INTEGER NOT NULL DEFAULT 0,
  url_ga_parameters INTEGER NOT NULL DEFAULT 0,
  kind TEXT,
  content_type TEXT,
  status_code INTEGER,
  status_text TEXT,
  response_time_ms INTEGER,
  size INTEGER,
  transferred INTEGER,
  http_version TEXT,
  last_modified TEXT,
  crawl_timestamp TEXT,
  redirect_url TEXT,
  redirect_type TEXT,
  redirect_chain_length INTEGER NOT NULL DEFAULT 0,
  redirect_loop INTEGER NOT NULL DEFAULT 0,
  final_url TEXT,
  blocked_by_robots INTEGER NOT NULL DEFAULT 0,
  robots_line TEXT,
  indexability TEXT,
  indexability_status TEXT,
  title TEXT,
  title_len INTEGER,
  title_px INTEGER,
  title_count INTEGER NOT NULL DEFAULT 0,
  title_outside_head INTEGER NOT NULL DEFAULT 0,
  meta_description TEXT,
  meta_description_len INTEGER,
  meta_description_px INTEGER,
  meta_description_count INTEGER NOT NULL DEFAULT 0,
  meta_description_outside_head INTEGER NOT NULL DEFAULT 0,
  meta_keywords TEXT,
  meta_keywords_len INTEGER,
  meta_keywords_count INTEGER NOT NULL DEFAULT 0,
  h1_1 TEXT,
  h1_1_len INTEGER,
  h1_2 TEXT,
  h1_2_len INTEGER,
  h1_count INTEGER NOT NULL DEFAULT 0,
  h1_alt_text INTEGER NOT NULL DEFAULT 0,
  h1_non_sequential INTEGER NOT NULL DEFAULT 0,
  h2_1 TEXT,
  h2_1_len INTEGER,
  h2_2 TEXT,
  h2_2_len INTEGER,
  h2_count INTEGER NOT NULL DEFAULT 0,
  h2_non_sequential INTEGER NOT NULL DEFAULT 0,
  canonical TEXT,
  canonical_count INTEGER NOT NULL DEFAULT 0,
  canonical_relative INTEGER NOT NULL DEFAULT 0,
  canonical_fragment INTEGER NOT NULL DEFAULT 0,
  canonical_outside_head INTEGER NOT NULL DEFAULT 0,
  canonical_invalid_attribute INTEGER NOT NULL DEFAULT 0,
  canonical_conflicting INTEGER NOT NULL DEFAULT 0,
  http_canonical TEXT,
  meta_robots TEXT,
  x_robots_tag TEXT,
  meta_robots_outside_head INTEGER NOT NULL DEFAULT 0,
  meta_refresh TEXT,
  rel_next TEXT,
  rel_prev TEXT,
  html_lang TEXT,
  word_count INTEGER,
  text_ratio REAL,
  hash TEXT,
  lorem_ipsum INTEGER NOT NULL DEFAULT 0,
  inlinks INTEGER NOT NULL DEFAULT 0,
  unique_inlinks INTEGER NOT NULL DEFAULT 0,
  follow_inlinks INTEGER NOT NULL DEFAULT 0,
  nofollow_inlinks INTEGER NOT NULL DEFAULT 0,
  indexable_inlinks INTEGER NOT NULL DEFAULT 0,
  outlinks INTEGER NOT NULL DEFAULT 0,
  unique_outlinks INTEGER NOT NULL DEFAULT 0,
  external_outlinks INTEGER NOT NULL DEFAULT 0,
  unique_external_outlinks INTEGER NOT NULL DEFAULT 0,
  nofollow_outlinks INTEGER NOT NULL DEFAULT 0,
  no_anchor_outlinks INTEGER NOT NULL DEFAULT 0,
  non_descriptive_outlinks INTEGER NOT NULL DEFAULT 0,
  localhost_outlinks INTEGER NOT NULL DEFAULT 0,
  hsts INTEGER NOT NULL DEFAULT 0,
  csp INTEGER NOT NULL DEFAULT 0,
  x_content_type_options INTEGER NOT NULL DEFAULT 0,
  x_frame_options INTEGER NOT NULL DEFAULT 0,
  referrer_policy TEXT,
  mixed_content INTEGER NOT NULL DEFAULT 0,
  insecure_form_action INTEGER NOT NULL DEFAULT 0,
  form_on_http INTEGER NOT NULL DEFAULT 0,
  unsafe_cross_origin INTEGER NOT NULL DEFAULT 0,
  protocol_relative_links INTEGER NOT NULL DEFAULT 0,
  bad_content_type INTEGER NOT NULL DEFAULT 0,
  hreflang_count INTEGER NOT NULL DEFAULT 0,
  hreflang_outside_head INTEGER NOT NULL DEFAULT 0,
  hreflang_invalid_codes INTEGER NOT NULL DEFAULT 0,
  rel_next_count INTEGER NOT NULL DEFAULT 0,
  rel_prev_count INTEGER NOT NULL DEFAULT 0,
  sd_count INTEGER NOT NULL DEFAULT 0,
  sd_types TEXT,
  sd_errors INTEGER NOT NULL DEFAULT 0,
  sd_warnings INTEGER NOT NULL DEFAULT 0,
  sd_rich_errors INTEGER NOT NULL DEFAULT 0,
  sd_rich_warnings INTEGER NOT NULL DEFAULT 0,
  sd_rich_features TEXT,
  sd_parse_errors INTEGER NOT NULL DEFAULT 0,
  sd_jsonld INTEGER NOT NULL DEFAULT 0,
  sd_microdata INTEGER NOT NULL DEFAULT 0,
  sd_rdfa INTEGER NOT NULL DEFAULT 0,
  minhash BLOB,
  near_duplicate_count INTEGER NOT NULL DEFAULT 0,
  closest_similarity REAL,
  closest_similar_url TEXT,
  sentence_count INTEGER,
  flesch_score REAL,
  soft_404 INTEGER NOT NULL DEFAULT 0,
  is_sitemap INTEGER NOT NULL DEFAULT 0,
  sitemap_url_count INTEGER,
  head_count INTEGER,
  body_count INTEGER,
  head_not_first INTEGER NOT NULL DEFAULT 0,
  invalid_head_elements INTEGER NOT NULL DEFAULT 0,
  body_before_html INTEGER NOT NULL DEFAULT 0,
  rendered INTEGER NOT NULL DEFAULT 0,
  raw_title TEXT,
  raw_meta_description TEXT,
  raw_h1 TEXT,
  raw_canonical TEXT,
  raw_meta_robots TEXT,
  raw_word_count INTEGER,
  js_link_count INTEGER NOT NULL DEFAULT 0,
  js_errors INTEGER NOT NULL DEFAULT 0,
  js_warnings INTEGER NOT NULL DEFAULT 0,
  js_messages TEXT,
  blocked_resources INTEGER NOT NULL DEFAULT 0,
  a11y_checked INTEGER NOT NULL DEFAULT 0,
  a11y_violations INTEGER NOT NULL DEFAULT 0,
  psi_status TEXT,
  psi_score INTEGER,
  psi_lcp_ms INTEGER,
  psi_fcp_ms INTEGER,
  psi_tbt_ms INTEGER,
  psi_si_ms INTEGER,
  psi_cls REAL,
  psi_crux TEXT,
  gsc_has_data INTEGER,
  gsc_clicks INTEGER,
  gsc_impressions INTEGER,
  gsc_ctr REAL,
  gsc_position REAL,
  gsc_inspection_status TEXT,
  gsc_verdict TEXT,
  gsc_coverage TEXT,
  gsc_indexing_state TEXT,
  gsc_robots_state TEXT,
  gsc_fetch_state TEXT,
  gsc_last_crawl TEXT,
  gsc_crawled_as TEXT,
  gsc_google_canonical TEXT,
  gsc_user_canonical TEXT,
  gsc_rich_verdict TEXT,
  ga_has_data INTEGER,
  ga_sessions INTEGER,
  ga_users INTEGER,
  ga_views INTEGER,
  ga_engagement_rate REAL,
  ga_avg_duration REAL,
  ga_bounce_rate REAL,
  ga_key_events REAL,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_urls_queue ON urls(state, queue_seq);
CREATE INDEX IF NOT EXISTS idx_urls_scope ON urls(is_internal, kind, status_code);
CREATE INDEX IF NOT EXISTS idx_urls_title ON urls(title);
CREATE INDEX IF NOT EXISTS idx_urls_meta_description ON urls(meta_description);
CREATE INDEX IF NOT EXISTS idx_urls_meta_keywords ON urls(meta_keywords);
CREATE INDEX IF NOT EXISTS idx_urls_h1 ON urls(h1_1);
CREATE INDEX IF NOT EXISTS idx_urls_h2 ON urls(h2_1);
CREATE INDEX IF NOT EXISTS idx_urls_hash ON urls(hash);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY,
  src_id INTEGER NOT NULL,
  dst_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  anchor TEXT,
  alt TEXT,
  rel TEXT,
  follow INTEGER NOT NULL DEFAULT 1,
  target TEXT,
  position TEXT,
  path_type TEXT,
  has_dimensions INTEGER
);

CREATE INDEX IF NOT EXISTS idx_links_src ON links(src_id);
CREATE INDEX IF NOT EXISTS idx_links_dst ON links(dst_id, type);

CREATE TABLE IF NOT EXISTS headers (
  url_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_headers_url ON headers(url_id);

CREATE TABLE IF NOT EXISTS hreflang (
  url_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  target TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hreflang_url ON hreflang(url_id);
CREATE INDEX IF NOT EXISTS idx_hreflang_target ON hreflang(target);

CREATE TABLE IF NOT EXISTS structured_data (
  url_id INTEGER NOT NULL,
  format TEXT NOT NULL,
  type TEXT,
  errors TEXT,
  warnings TEXT
);

CREATE INDEX IF NOT EXISTS idx_structured_data_url ON structured_data(url_id);

CREATE TABLE IF NOT EXISTS sitemap_entries (
  sitemap_id INTEGER NOT NULL,
  url_id INTEGER NOT NULL,
  PRIMARY KEY (sitemap_id, url_id)
);

CREATE INDEX IF NOT EXISTS idx_sitemap_entries_url ON sitemap_entries(url_id);

CREATE TABLE IF NOT EXISTS custom_values (
  url_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  slot INTEGER NOT NULL,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_custom_values ON custom_values(kind, slot, url_id);

CREATE TABLE IF NOT EXISTS accessibility (
  url_id INTEGER NOT NULL,
  rule TEXT NOT NULL,
  impact TEXT,
  tags TEXT NOT NULL,
  nodes INTEGER NOT NULL,
  help TEXT
);

CREATE INDEX IF NOT EXISTS idx_accessibility_url ON accessibility(url_id);

CREATE TABLE IF NOT EXISTS near_duplicates (
  url_id INTEGER NOT NULL,
  other_id INTEGER NOT NULL,
  similarity REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_near_duplicates_url ON near_duplicates(url_id);

CREATE TABLE IF NOT EXISTS screenshots (
  url_id INTEGER PRIMARY KEY,
  png BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS raw_sources (
  url_id INTEGER PRIMARY KEY,
  html TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  url_id INTEGER PRIMARY KEY,
  html TEXT NOT NULL
);
`
