import { describe, expect, it } from 'vitest'
import { isAppUrl } from '../../src/main/utils/isAppUrl'

describe('isAppUrl', () => {
  it('allows the dev server origin', () => expect(isAppUrl('http://localhost:5173/#/x', 'http://localhost:5173/')).toBe(true))
  it('blocks other origins', () => expect(isAppUrl('https://evil.example/', 'http://localhost:5173/')).toBe(false))
  it('allows the renderer index file', () => expect(isAppUrl('file:///C:/app/index.html#a', 'file:///C:/app/index.html')).toBe(true))
  it('blocks other files', () => expect(isAppUrl('file:///C:/secret.html', 'file:///C:/app/index.html')).toBe(false))
})
