import { describe, expect, it } from 'vitest'
import { rowsToTsv } from '../../src/renderer/src/utils/rowsToTsv'

describe('rowsToTsv', () => {
  it('writes a header row and replaces tabs and new lines in cells', () => {
    expect(rowsToTsv(['Address', 'Title'], [['https://a.com/', 'One\tTwo\nThree'], ['https://b.com/', null]])).toBe(
      'Address\tTitle\nhttps://a.com/\tOne Two Three\nhttps://b.com/\t'
    )
  })
})
