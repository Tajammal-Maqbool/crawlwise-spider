import { createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import ExcelJS from 'exceljs'
import { CSV_BOM, CSV_EOL, csvLine } from '@shared/utils/csv'
import { neutralizeFormula } from '@shared/utils/neutralizeFormula'

const XLSX_ROW_LIMIT = 1048575

function* csvChunks(header: string[], rows: Iterable<unknown[]>): Generator<string> {
  yield `${CSV_BOM}${csvLine(header)}${CSV_EOL}`
  for (const row of rows) yield `${csvLine(row)}${CSV_EOL}`
}

async function writeCsv(path: string, header: string[], rows: Iterable<unknown[]>): Promise<void> {
  await pipeline(Readable.from(csvChunks(header, rows)), createWriteStream(path, { encoding: 'utf8' }))
}

async function writeXlsx(path: string, sheetName: string, header: string[], rows: Iterable<unknown[]>): Promise<void> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: path, useStyles: true })
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31).replace(/[\/?*[\]:]/g, ' '), {
    views: [{ state: 'frozen', ySplit: 1 }]
  })
  const headerRow = sheet.addRow(header.map((h) => neutralizeFormula(h)))
  headerRow.font = { bold: true }
  headerRow.commit()
  let count = 0
  try {
    for (const row of rows) {
      if (++count > XLSX_ROW_LIMIT) throw new Error('Too many rows for one Excel sheet. Export as CSV instead.')
      sheet.addRow(row.map((v) => (v === null || v === undefined ? '' : neutralizeFormula(v as string | number)))).commit()
    }
    sheet.commit()
    await workbook.commit()
  } catch (error) {
    await rm(path, { force: true }).catch(() => undefined)
    throw error
  }
}

export async function writeTable(path: string, sheetName: string, header: string[], rows: Iterable<unknown[]>): Promise<void> {
  if (path.toLowerCase().endsWith('.xlsx')) await writeXlsx(path, sheetName, header, rows)
  else await writeCsv(path, header, rows)
}
