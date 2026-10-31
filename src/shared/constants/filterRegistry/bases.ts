export const DONE = (a = 'u') => `${a}.state = 3`

export const INTERNAL = (a = 'u') => `${a}.is_internal = 1 AND ${DONE(a)}`

export const EXTERNAL = (a = 'u') => `${a}.is_internal = 0 AND ${DONE(a)}`

export const IS_2XX = (a = 'u') => `${a}.status_code BETWEEN 200 AND 299`

export const INTERNAL_2XX = (a = 'u') => `${INTERNAL(a)} AND ${IS_2XX(a)}`

export const INTERNAL_HTML_2XX = (a = 'u') => `${INTERNAL_2XX(a)} AND ${a}.kind = 'html'`

export const IMAGES_2XX = (a = 'u') => `${DONE(a)} AND ${a}.kind = 'image' AND ${IS_2XX(a)}`

export const ROBOTS_TEXT = "lower(coalesce(u.meta_robots, '') || ',' || coalesce(u.x_robots_tag, ''))"

export function duplicateOf(column: string, base: (a?: string) => string): string {
  return `coalesce(u.${column}, '') <> '' AND u.${column} IN (SELECT x.${column} FROM urls x WHERE ${base('x')} AND coalesce(x.${column}, '') <> '' GROUP BY x.${column} HAVING COUNT(*) > 1)`
}
