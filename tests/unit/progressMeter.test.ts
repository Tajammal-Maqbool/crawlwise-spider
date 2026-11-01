import { describe, expect, it } from 'vitest'
import { ProgressMeter } from '../../src/main/crawler/progressMeter'

function clock(): { now: () => number; advance: (ms: number) => void } {
  let t = 1_000_000
  return { now: () => t, advance: (ms) => (t += ms) }
}

describe('ProgressMeter average', () => {
  it('divides crawled URLs by active seconds', () => {
    const c = clock()
    const meter = new ProgressMeter(c.now)
    meter.start(0)
    meter.setActive(true)
    c.advance(4000)
    expect(meter.average(10)).toBe(2.5)
  })

  it('excludes paused time', () => {
    const c = clock()
    const meter = new ProgressMeter(c.now)
    meter.start(0)
    meter.setActive(true)
    c.advance(2000)
    meter.setActive(false)
    c.advance(60000)
    meter.setActive(true)
    c.advance(2000)
    expect(meter.average(8)).toBe(2)
  })

  it('freezes when the crawl ends', () => {
    const c = clock()
    const meter = new ProgressMeter(c.now)
    meter.start(0)
    meter.setActive(true)
    c.advance(5000)
    meter.setActive(false)
    c.advance(100000)
    expect(meter.average(20)).toBe(4)
  })

  it('counts only URLs crawled since the start of the session', () => {
    const c = clock()
    const meter = new ProgressMeter(c.now)
    meter.start(100)
    meter.setActive(true)
    c.advance(10000)
    expect(meter.average(130)).toBe(3)
  })

  it('returns 0 before any active time', () => {
    expect(new ProgressMeter(clock().now).average(5)).toBe(0)
  })
})
