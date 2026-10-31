import { describe, expect, it } from 'vitest'
import { mergeColumnLayout, moveColumn, toggleColumn } from '../../src/renderer/src/utils/columnLayout'

const width = () => 100

describe('column layout', () => {
  it('drops unknown columns, keeps widths and order, and appends new columns', () => {
    const stored = [
      { key: 'b', width: 50, visible: false },
      { key: 'gone', width: 70, visible: true },
      { key: 'a', width: 60, visible: true }
    ]
    expect(mergeColumnLayout(stored, ['a', 'b', 'c'], width)).toEqual([
      { key: 'b', width: 50, visible: false },
      { key: 'a', width: 60, visible: true },
      { key: 'c', width: 100, visible: true }
    ])
  })

  it('moves a column before another one', () => {
    const cols = ['a', 'b', 'c'].map((key) => ({ key, width: 1, visible: true }))
    expect(moveColumn(cols, 'c', 'a').map((c) => c.key)).toEqual(['c', 'a', 'b'])
  })

  it('never hides the last visible column', () => {
    const cols = [{ key: 'a', width: 1, visible: true }, { key: 'b', width: 1, visible: false }]
    expect(toggleColumn(cols, 'a')[0].visible).toBe(true)
    expect(toggleColumn(cols, 'b')[1].visible).toBe(true)
  })
})
