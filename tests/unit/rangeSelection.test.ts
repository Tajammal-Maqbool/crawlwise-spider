import { describe, expect, it } from 'vitest'
import { EMPTY_SELECTION, selectRow } from '../../src/renderer/src/utils/rangeSelection'

const plain = { shift: false, toggle: false }

describe('row selection', () => {
  it('selects one row, then a range with Shift', () => {
    const one = selectRow(EMPTY_SELECTION, 2, plain)
    expect([...one.indices]).toEqual([2])
    expect([...selectRow(one, 5, { shift: true, toggle: false }).indices]).toEqual([2, 3, 4, 5])
  })

  it('adds and removes single rows with Ctrl', () => {
    const a = selectRow(selectRow(EMPTY_SELECTION, 1, plain), 4, { shift: false, toggle: true })
    expect([...a.indices].sort()).toEqual([1, 4])
    expect([...selectRow(a, 1, { shift: false, toggle: true }).indices]).toEqual([4])
  })
})
