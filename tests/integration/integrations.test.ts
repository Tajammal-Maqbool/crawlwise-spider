import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { redactSecrets } from '@shared/utils/redactSecrets'
import { runFixtureCrawl, type FixtureCrawl } from '../fixtures/runFixtureCrawl'
import { startFakeApi, type FakeApi } from '../fixtures/fakeApiServer'
import { createOllamaRunner } from '../../src/main/integrations/ollamaPrompt'

let api: FakeApi
let crawl: FixtureCrawl

const configFor = (startUrl: string, base: string): CrawlConfig => ({
  ...DEFAULT_CONFIG,
  startUrl,
  integrations: {
    ...DEFAULT_CONFIG.integrations,
    pagespeed: { ...DEFAULT_CONFIG.integrations.pagespeed, enabled: true, apiKey: 'psi-test-key', endpoint: `${base}/psi`, maxPages: 3 },
    ai: { ...DEFAULT_CONFIG.integrations.ai, enabled: true, apiKey: 'sk-ant-test', baseUrl: base, maxPages: 2, prompts: [{ name: 'Summary', prompt: 'Summarise this page.' }] }
  }
})

beforeAll(async () => {
  api = await startFakeApi()
  crawl = await runFixtureCrawl((startUrl) => configFor(startUrl, api.base))
})

afterAll(async () => {
  await crawl?.close()
  await api?.close()
})

describe('API integrations', () => {
  it('stores PageSpeed results and flags slow pages', () => {
    expect(crawl.paths('pagespeed:all')).toHaveLength(3)
    expect(crawl.paths('pagespeed:poor')).toHaveLength(3)
    expect(crawl.paths('pagespeed:lcp-over')).toHaveLength(3)
    expect(crawl.paths('pagespeed:cls-over')).toHaveLength(0)
    expect(api.requests.some((r) => r.path === '/psi')).toBe(true)
  })

  it('calls Claude through the SDK with the fallback beta and stores answers', () => {
    const call = api.requests.find((r) => r.path === '/v1/messages')
    expect(call).toBeDefined()
    expect(`${call?.headers['x-api-key'] ?? ''} ${call?.headers.authorization ?? ''}`).toContain('sk-ant-test')
    expect(String(call?.headers['anthropic-beta'])).toContain('server-side-fallback-2026-07-01')
    const body = JSON.parse(call!.body)
    expect(body.model).toBe('claude-opus-5-5')
    expect(body.fallbacks).toBe('default')
    expect(body.messages[0].content).toContain('Summarise this page.')
    expect(body.messages[0].content).toContain('Page URL:')
    expect(crawl.paths('ai:prompt-1')).toHaveLength(2)
  })

  it('never keeps API keys in saved config', () => {
    const safe = redactSecrets(configFor('https://a.com/', api.base))
    expect(JSON.stringify(safe)).not.toContain('sk-ant-test')
    expect(JSON.stringify(safe)).not.toContain('psi-test-key')
  })

  it('calls a local Ollama model', async () => {
    const ask = createOllamaRunner({ ...DEFAULT_CONFIG.integrations.ai, provider: 'ollama', model: 'llama3.1', baseUrl: api.base })
    expect(await ask('Hello')).toBe('Ollama answer')
    const call = api.requests.find((r) => r.path === '/api/generate')
    expect(JSON.parse(call!.body)).toMatchObject({ model: 'llama3.1', prompt: 'Hello', stream: false })
  })
})
