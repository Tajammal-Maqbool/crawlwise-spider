import { describe, expect, it } from 'vitest'
import { parseSetCookie } from '../../src/main/utils/parseSetCookie'

describe('parseSetCookie', () => {
  it('reads name, path and SameSite and defaults to a session cookie', () => {
    expect(parseSetCookie('a=1; Path=/shop; SameSite=Lax; HttpOnly', 'https://example.com/x')).toEqual({
      name: 'a', value: '1', domain: 'example.com', path: '/shop', expires: 'End of Session', sameSite: 'Lax', secure: false, httpOnly: true
    })
  })

  it('marks Max-Age=0 as immediate and keeps the given domain', () => {
    const c = parseSetCookie('sid=; Max-Age=0; Domain=.example.com; Secure', 'https://www.example.com/')
    expect(c.expires).toBe('Immediate')
    expect(c.domain).toBe('.example.com')
    expect(c.secure).toBe(true)
  })
})
