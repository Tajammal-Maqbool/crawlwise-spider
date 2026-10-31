import { describe, expect, it } from 'vitest'
import { barRects, foldSlices, pieSlices } from '../../src/renderer/src/utils/chartScale'

describe('chart scales', () => {
  it('draws nothing for empty or all-zero data', () => {
    expect(barRects([], 100, 50)).toEqual([])
    expect(barRects([{ label: 'a', value: 0 }], 100, 50)).toEqual([])
    expect(pieSlices([], 40)).toEqual([])
  })

  it('scales the tallest bar to the full height', () => {
    const rects = barRects([{ label: 'a', value: 5 }, { label: 'b', value: 10 }], 100, 50)
    expect(rects[1].height).toBe(50)
    expect(rects[0].height).toBe(25)
  })

  it('makes pie slices that add up to 360 degrees and folds small ones into Other', () => {
    const data = Array.from({ length: 9 }, (_, i) => ({ label: `s${i}`, value: i + 1 }))
    const folded = foldSlices(data)
    expect(folded).toHaveLength(6)
    expect(folded[5].label).toBe('Other')
    const slices = pieSlices(folded, 40)
    expect(slices[slices.length - 1].endAngle).toBeCloseTo(360, 5)
  })
})
