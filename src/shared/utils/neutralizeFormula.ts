const FORMULA_PREFIX = /^[=+\-@\t\r]/

export function neutralizeFormula<T>(value: T): T | string {
  return typeof value === 'string' && FORMULA_PREFIX.test(value) ? `'${value}` : value
}
