import { describe, expect, it } from 'vitest'
import { neutralizeFormula } from '@shared/utils/neutralizeFormula'
import { csvCell, toCsv } from '@shared/utils/csv'

describe('neutralizeFormula', () => {
  it.each(['=HYPERLINK("http://x","y")', '+cmd', '-1+1', '@SUM(A1)', '\tx', '\rx'])('prefixes %j', (v) => {
    expect(neutralizeFormula(v)).toBe(`'${v}`)
  })
  it('leaves safe strings and numbers alone', () => {
    expect(neutralizeFormula('hello')).toBe('hello')
    expect(neutralizeFormula('')).toBe('')
    expect(neutralizeFormula(-5)).toBe(-5)
  })
})

describe('csv formula neutralization', () => {
  it('neutralizes string cells but not numbers', () => {
    expect(csvCell('=1+1')).toBe("'=1+1")
    expect(csvCell(-5)).toBe('-5')
    expect(csvCell('-1+1,x')).toBe(`"'-1+1,x"`)
    expect(toCsv(['h'], [['@a']])).toBe("﻿h\r\n'@a\r\n")
  })
})
