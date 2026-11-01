import { describe, expect, it } from 'vitest'
import { HostThrottle } from '../../src/main/crawler/hostThrottle'

describe('HostThrottle minimum interval', () => {
  it('spaces consecutive requests to one host', async () => {
    const throttle = new HostThrottle()
    throttle.setMinInterval('a.test', 80)
    const start = Date.now()
    await throttle.wait('a.test')
    await throttle.wait('a.test')
    await throttle.wait('a.test')
    expect(Date.now() - start).toBeGreaterThanOrEqual(150)
  })

  it('spaces concurrent waiters', async () => {
    const throttle = new HostThrottle()
    throttle.setMinInterval('a.test', 80)
    const start = Date.now()
    await Promise.all([throttle.wait('a.test'), throttle.wait('a.test'), throttle.wait('a.test')])
    expect(Date.now() - start).toBeGreaterThanOrEqual(150)
  })

  it('does not slow other hosts', async () => {
    const throttle = new HostThrottle()
    throttle.setMinInterval('a.test', 500)
    const start = Date.now()
    await throttle.wait('b.test')
    await throttle.wait('b.test')
    expect(Date.now() - start).toBeLessThan(100)
  })
})
