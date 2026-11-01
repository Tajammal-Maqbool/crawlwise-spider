import { describe, expect, it } from 'vitest'
import { effectiveDelayMs } from '../../src/main/utils/effectiveDelayMs'
import { MAX_ROBOTS_CRAWL_DELAY_SECONDS } from '../../src/main/constants/crawlDelay'

describe('effectiveDelayMs', () => {
  it('uses the larger of configured rate and crawl-delay', () => {
    expect(effectiveDelayMs(0, 2)).toBe(2000)
    expect(effectiveDelayMs(1, 0.5)).toBe(1000)
    expect(effectiveDelayMs(2, 3)).toBe(3000)
  })

  it('returns 0 without any delay', () => {
    expect(effectiveDelayMs(0, null)).toBe(0)
  })

  it('caps the crawl-delay', () => {
    expect(effectiveDelayMs(0, 9999)).toBe(MAX_ROBOTS_CRAWL_DELAY_SECONDS * 1000)
  })

  it('ignores invalid crawl-delay values', () => {
    expect(effectiveDelayMs(0, Number.NaN)).toBe(0)
    expect(effectiveDelayMs(0, -3)).toBe(0)
  })
})
