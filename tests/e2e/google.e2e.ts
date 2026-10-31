import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ElectronApplication, Page } from 'playwright-core'
import { startFixtureSite, type FixtureSite } from '../fixtures/fixtureSite'
import { FAKE_CLIENT, FAKE_EMAIL, FAKE_GA_PROPERTY, startFakeGoogle, type FakeGoogle } from '../fixtures/fakeGoogleServer'
import { launchApp } from '../fixtures/launchApp'
import { filterCount, openTab, runMenu, selectFilter } from '../fixtures/uiHelpers'

let app: ElectronApplication
let page: Page
let site: FixtureSite
let google: FakeGoogle
let appData: string

beforeAll(async () => {
  site = await startFixtureSite()
  google = await startFakeGoogle()
  google.setSite(site.url)
  appData = mkdtempSync(join(tmpdir(), 'seo-spider-google-e2e-'))
  app = await launchApp(appData, { SEO_SPIDER_GOOGLE_API_BASE: google.base })
  await app.evaluate(({ shell }) => {
    shell.openExternal = async (url: string) => {
      await fetch(url)
    }
  })
  page = await app.firstWindow()
  await page.waitForSelector('.menu-bar')
})

afterAll(async () => {
  await app?.close()
  await site?.close()
  await google?.close()
  rmSync(appData, { recursive: true, force: true })
})

describe('Google integrations in the desktop app', () => {
  it('connects a Google account and keeps the token encrypted', async () => {
    await runMenu(page, 'Configuration', 'API Access...')
    await page.getByLabel('OAuth Client ID').fill(FAKE_CLIENT.id)
    await page.getByLabel('OAuth Client Secret').fill(FAKE_CLIENT.secret)
    await page.getByRole('button', { name: 'Connect' }).click()
    await page.locator('.google-status', { hasText: FAKE_EMAIL }).waitFor({ timeout: 20000 })

    const login = google.requests.find((r) => r.path === '/o/oauth2/v2/auth')
    expect(String(login?.headers['user-agent'])).not.toContain('Mozilla')

    const stored = join(appData, 'google-account.bin')
    expect(existsSync(stored)).toBe(true)
    expect(readFileSync(stored).toString('latin1')).not.toContain('refresh-1')
  })

  it('imports Search Console and GA4 data into a crawl', async () => {
    await page.getByRole('button', { name: 'Load Properties' }).first().click()
    await page.getByLabel(/^Property(?! ID)/).fill(site.url)
    await page.getByLabel('Import Search Console data for this crawl').check()
    await page.getByLabel('Run URL Inspection on crawled pages').check()
    await page.getByLabel('Import GA4 data for this crawl').check()
    await page.getByLabel('Property ID').fill(FAKE_GA_PROPERTY)
    await page.getByRole('button', { name: 'OK' }).click()

    await page.getByLabel('Start URL').fill(site.url)
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.status-bar .state', { hasText: 'Completed' }).waitFor({ timeout: 120000 })

    await openTab(page, 'Search Console')
    await expect.poll(() => filterCount(page, 'Clicks Above 0')).toBe(3)
    await expect.poll(() => filterCount(page, 'URL Is Not on Google')).toBe(1)
    await expect.poll(() => filterCount(page, 'User-Declared Canonical Not Selected')).toBe(1)

    await openTab(page, 'Analytics')
    await expect.poll(() => filterCount(page, 'Sessions Above 0')).toBe(4)
    await selectFilter(page, 'Orphan URLs')
    await expect.poll(() => page.locator('.grid-row .grid-cell:nth-child(2)').allTextContents()).toEqual([`${site.url}ga-orphan`])

    expect(google.requests.some((r) => r.path === '/webmasters/v3/sites')).toBe(true)
    expect(google.requests.some((r) => r.path === '/v1/urlInspection/index:inspect')).toBe(true)
  }, 150000)
})
