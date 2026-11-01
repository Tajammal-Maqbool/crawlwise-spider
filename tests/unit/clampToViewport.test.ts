import { describe, expect, it } from 'vitest'
import { clampToViewport } from '../../src/renderer/src/utils/clampToViewport'

const viewport = { width: 800, height: 600 }
const size = { width: 200, height: 150 }

describe('clampToViewport', () => {
  it('keeps a position that already fits', () => {
    expect(clampToViewport({ x: 100, y: 100 }, size, viewport)).toEqual({ x: 100, y: 100 })
  })

  it('moves the menu left and up when it would overflow', () => {
    expect(clampToViewport({ x: 750, y: 580 }, size, viewport)).toEqual({ x: 600, y: 450 })
  })

  it('never goes below zero when the menu is larger than the viewport', () => {
    expect(clampToViewport({ x: 10, y: 10 }, { width: 900, height: 700 }, viewport)).toEqual({ x: 0, y: 0 })
  })
})
