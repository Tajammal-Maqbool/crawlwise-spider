import { writeFileSync } from 'node:fs'
import ExcelJS from 'exceljs'
import { toCsv } from '@shared/utils/csv'

const XLSX_ROW_LIMIT = 1048575

export async function writeTable(path: string, sheetName: string, header: string[], rows: unknown[][]): Promise<void> {
  if (!path.toLowerCase().endsWith('.xlsx')) {
    writeFileSync(path, toCsv(header, rows), 'utf8')
    return
  }
  if (rows.length > XLSX_ROW_LIMIT) throw new Error('Too many rows for one Excel sheet. Export as CSV instead.')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31).replace(/[\\/?*[\]:]/g, ' '))
  sheet.addRow(header).font = { bold: true }
  for (const row of rows) sheet.addRow(row.map((v) => (v === null || v === undefined ? '' : (v as string | number))))
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  await workbook.xlsx.writeFile(path)
}
