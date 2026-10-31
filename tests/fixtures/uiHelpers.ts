import type { ElectronApplication, Page } from 'playwright-core'
import { writeFileSync } from 'node:fs'

export async function openTab(page: Page, label: string): Promise<void> {
  const tab = page.locator('.main-tabs-row .main-tab', { hasText: label }).filter({ hasNotText: '»' })
  const exact = tab.getByText(label, { exact: true })
  if ((await exact.count()) > 0 && (await exact.first().isVisible())) {
    await exact.first().click()
    return
  }
  await page.getByRole('button', { name: 'More tabs' }).click()
  await page.locator('.overflow-list .menu-item').getByText(label, { exact: true }).click()
}

export async function filterCount(page: Page, label: string): Promise<number> {
  const options = await page.locator('select[aria-label="Filter"] option').allTextContents()
  const option = options.find((o) => o.replace(/ \([\d,]+\)$/, '') === label)
  if (!option) return -1
  return Number(/\(([\d,]+)\)$/.exec(option)?.[1].replace(/,/g, '') ?? -1)
}

export async function selectFilter(page: Page, label: string): Promise<void> {
  const options = await page.locator('select[aria-label="Filter"] option').allTextContents()
  const option = options.find((o) => o.replace(/ \([\d,]+\)$/, '') === label)
  if (!option) throw new Error(`No filter ${label}`)
  await page.getByLabel('Filter', { exact: true }).selectOption({ label: option })
}

export async function runMenu(page: Page, menu: string, item: string): Promise<void> {
  await page.locator('.menu-bar .menu-title', { hasText: menu }).click()
  await page.locator('.menu-dropdown .menu-item').getByText(item, { exact: true }).click()
}

export async function saveScreenshot(app: ElectronApplication, path: string | undefined): Promise<void> {
  if (!path) return
  const png = await app.evaluate(async ({ BrowserWindow }) => {
    const image = await BrowserWindow.getAllWindows()[0].webContents.capturePage()
    return image.toPNG().toString('base64')
  })
  writeFileSync(path, Buffer.from(png, 'base64'))
}
