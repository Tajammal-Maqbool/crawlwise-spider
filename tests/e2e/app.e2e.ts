import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ElectronApplication, Page } from 'playwright-core'
import { startFixtureSite, type FixtureSite } from '../fixtures/fixtureSite'
import { launchApp } from '../fixtures/launchApp'
import { filterCount, openTab, runMenu, saveScreenshot, selectFilter } from '../fixtures/uiHelpers'

let app: ElectronApplication
let page: Page
let site: FixtureSite
let appData: string

const RIGHT_TABS = ['Overview', 'Issues', 'Site Structure', 'Crawl Depth', 'Response Times', 'API']
const addresses = () => page.locator('.grid-row .grid-cell:nth-child(2)').allTextContents()
const copied = () => app.evaluate(() => (globalThis as unknown as { __copied: string[] }).__copied)
const rightTab = (name: string) => page.locator('.right-panel .panel-tabs').getByRole('tab', { name, exact: true })
const detailTab = (name: string) => page.locator('.detail-tabs').getByRole('tab', { name, exact: true })

async function selectUrl(path: string): Promise<void> {
  await page.getByLabel('Search address').fill(path)
  await expect.poll(addresses).toContainEqual(expect.stringMatching(new RegExp(`${path}$`)))
  const cell = page.locator('.grid-row .grid-cell:nth-child(2)', { hasText: new RegExp(`${path}$`) }).first()
  await cell.click()
}

async function crawl(): Promise<void> {
  await page.getByLabel('Start URL').fill(site.url)
  const state = page.locator('.status-bar .state')
  const before = await state.textContent()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  if (before === 'Completed') await expect.poll(() => state.textContent(), { timeout: 10000 }).not.toBe('Completed')
  await page.locator('.status-bar .state', { hasText: 'Completed' }).waitFor({ timeout: 120000 })
}

beforeAll(async () => {
  site = await startFixtureSite()
  appData = mkdtempSync(join(tmpdir(), 'seo-spider-e2e-'))
  app = await launchApp(appData)
  page = await app.firstWindow()
  await page.waitForSelector('.menu-bar')
})

afterAll(async () => {
  await app?.close()
  await site?.close()
  rmSync(appData, { recursive: true, force: true })
})

describe('desktop app', () => {
  it('shows every panel and disables crawl menus before any crawl', async () => {
    for (const name of RIGHT_TABS) {
      await rightTab(name).click()
      await expect.poll(() => page.locator('.right-panel .error-banner').count()).toBe(0)
    }
    await page.locator('.menu-bar .menu-title', { hasText: 'Bulk Export' }).click()
    expect(await page.locator('.menu-dropdown .menu-item').first().isDisabled()).toBe(true)
    await page.keyboard.press('Escape')
    await expect.poll(() => page.locator('.menu-dropdown').count()).toBe(0)
  })

  it('crawls a site and shows results in the tab strip and Filter dropdown', async () => {
    await crawl()
    await expect.poll(() => filterCount(page, 'All')).toBeGreaterThan(20)

    await openTab(page, 'Page Titles')
    await selectFilter(page, 'Duplicate')
    await expect.poll(() => page.locator('.grid-row').count()).toBe(4)

    await page.locator('.grid-row').first().click()
    await detailTab('Inlinks').click()
    await expect.poll(() => page.locator('.detail-body table tbody tr').count()).toBeGreaterThan(0)

    await rightTab('Issues').click()
    await page.locator('.issue-item', { hasText: 'Internal Client Error (4xx)' }).click()
    await page.locator('.issue-detail', { hasText: 'How To Fix' }).waitFor({ state: 'visible' })
    await saveScreenshot(app, process.env.E2E_SCREENSHOT)
  }, 150000)

  it('draws the overview, depth and response time charts', async () => {
    await rightTab('Overview').click()
    await page.locator('.overview-tab', { hasText: 'Page Titles' }).click()
    await expect.poll(() => page.locator('.right-panel .pie-chart path').count()).toBeGreaterThan(0)
    await rightTab('Crawl Depth').click()
    await expect.poll(() => page.locator('.right-panel .bar-chart rect').count()).toBeGreaterThan(0)
    await rightTab('Response Times').click()
    await expect.poll(() => page.locator('.right-panel .stat-table tbody tr').count()).toBe(11)
  })

  it('hides a column with the chooser and keeps it hidden after a reload', async () => {
    await openTab(page, 'Internal')
    const headers = () => page.locator('.grid-header [role="columnheader"]').allTextContents()
    await page.locator('.grid-header [role="columnheader"]').first().click({ button: 'right' })
    await page.locator('.column-chooser').getByLabel('Status Code').uncheck()
    await expect.poll(headers).not.toContain('Status Code')
    await page.reload()
    await page.waitForSelector('.menu-bar')
    await expect.poll(headers).not.toContain('Status Code')
    await runMenu(page, 'View', 'Reset Columns for All Tables')
    await expect.poll(headers).toContain('Status Code')
  })

  it('sends selected rows to the copy handler with Ctrl+C but not while typing in the search box', async () => {
    await runMenu(page, 'File', 'Crawls...')
    await page.locator('.modal table tbody tr').first().getByRole('button', { name: 'Open' }).click()
    await expect.poll(() => page.locator('.grid-row').count()).toBeGreaterThan(2)
    await page.locator('.grid-row').nth(0).click()
    await page.locator('.grid-row').nth(1).click({ modifiers: ['Shift'] })
    await expect.poll(() => page.locator('.grid-row.selected').count()).toBe(2)
    await app.evaluate(({ ipcMain }) => {
      const g = globalThis as unknown as { __copied: string[] }
      g.__copied = []
      ipcMain.removeHandler('app:copyText')
      ipcMain.handle('app:copyText', (_e, text: string) => void g.__copied.push(text))
    })
    await page.keyboard.press('Control+c')
    await expect.poll(async () => (await copied()).length).toBe(1)
    const lines = (await copied())[0].split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('Address')

    const search = page.getByLabel('Search address')
    await search.fill('zz')
    await search.selectText()
    await page.keyboard.press('Control+c')
    await page.waitForTimeout(300)
    expect(await copied()).toHaveLength(1)
    await search.fill('')
  })

  it('expands folders in Tree view', async () => {
    await page.getByRole('button', { name: 'Tree', exact: true }).click()
    await page.locator('.tree-row.folder').first().click()
    await page.locator('.tree-row.folder', { hasText: 'img/' }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'List', exact: true }).click()
  })

  it('opens hidden tabs from the overflow list in a narrow window', async () => {
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1024, 800))
    await expect.poll(() => page.getByRole('button', { name: 'More tabs' }).count()).toBe(1)
    await openTab(page, 'AI')
    await expect.poll(() => filterCount(page, 'Prompt Errors')).toBe(0)
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1440, 900))
  })

  it('switches to the dark theme and remembers it', async () => {
    await runMenu(page, 'View', 'Dark Theme')
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
    await page.reload()
    await page.waitForSelector('.menu-bar')
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
    await runMenu(page, 'View', 'Light Theme')
  })

  it('renders JavaScript and fills the rendered detail tabs', async () => {
    await runMenu(page, 'Configuration', 'Spider: Rendering...')
    await page.locator('.modal select').first().selectOption('javascript')
    await page.getByLabel('Accessibility (axe-core) on rendered pages').check()
    await page.getByLabel('Enable Rendered Page Screenshots').check()
    await page.getByRole('button', { name: 'OK' }).click()
    await crawl()

    await openTab(page, 'JavaScript')
    await expect.poll(() => filterCount(page, 'Page Title Updated by JavaScript')).toBe(1)
    await expect.poll(() => filterCount(page, 'Contains JavaScript Links')).toBe(1)
    await openTab(page, 'Internal')
    await selectUrl('/js-page')
    await detailTab('Rendered Page').click()
    await page.locator('.rendered-shot').waitFor({ state: 'visible' })
    await detailTab('Chrome Console Log').click()
    await expect.poll(() => page.locator('.detail-body table tbody tr').count()).toBeGreaterThan(0)
    await detailTab('View Source').click()
    await page.locator('.source-compare', { hasText: 'Rendered HTML' }).waitFor({ state: 'visible' })

    await selectUrl('/near-1')
    await detailTab('Duplicate Details').click()
    await page.locator('.detail-body td', { hasText: '/near-2' }).waitFor({ state: 'visible' })
    await page.getByLabel('Search address').fill('')

    await openTab(page, 'Accessibility')
    await selectFilter(page, 'WCAG 2.0 A Violation')
    await expect.poll(addresses).toContainEqual(expect.stringMatching(/\/images$/))
  }, 150000)
})
