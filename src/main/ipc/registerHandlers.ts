import { BrowserWindow, clipboard, dialog, ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipcChannels'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { ExportRequest, ExportResult } from '@shared/interfaces/exportRequest'
import type { GridQuery } from '@shared/interfaces/gridQuery'
import { countFilters, queryPage } from '../db/queryService'
import { getUrlDetail } from '../db/detailService'
import { getSiteStructure } from '../db/structureService'
import { getApiStatus, getDepthStats, getResponseTimes } from '../db/statsService'
import { getTreeRows } from '../db/treeService'
import { reanalyseCrawl } from '../services/crawlAnalysis'
import { registerCompareHandlers } from './registerCompareHandlers'
import { registerSecretHandlers } from './registerSecretHandlers'
import { BULK_EXPORTS, ISSUES_REPORT_KEY } from '@shared/constants/bulkExports'
import { defaultExportName, exportBulk, exportFilter, filterExportLabel } from '../services/exportService'
import type { CrawlLibrary } from '../services/crawlLibrary'
import type { CrawlManager } from '../services/crawlManager'
import type { Scheduler } from '../services/scheduler'
import type { ScheduledTaskInput } from '@shared/interfaces/scheduledTask'

export function registerHandlers(library: CrawlLibrary, manager: CrawlManager, scheduler: Scheduler): void {
  ipcMain.handle(IPC.scheduleList, () => scheduler.list())
  ipcMain.handle(IPC.scheduleCreate, (_e, input: ScheduledTaskInput, config: CrawlConfig) => scheduler.create(input, config))
  ipcMain.handle(IPC.scheduleDelete, (_e, id: string) => scheduler.delete(id))
  ipcMain.handle(IPC.crawlStart, (_e, config: CrawlConfig) => manager.start(config))
  ipcMain.handle(IPC.crawlPause, () => manager.pause())
  ipcMain.handle(IPC.crawlResume, () => manager.resume())
  ipcMain.handle(IPC.crawlStop, () => manager.stop())
  ipcMain.handle(IPC.crawlContinue, (_e, id: string) => manager.continue(id))
  ipcMain.handle(IPC.crawlList, () => library.list())
  ipcMain.handle(IPC.crawlConfig, (_e, id: string) => library.config(id))
  ipcMain.handle(IPC.crawlDelete, (_e, id: string) => {
    if (manager.isActive(id)) throw new Error('Stop the crawl before you delete it.')
    library.delete(id)
  })

  ipcMain.handle(IPC.dataCounts, (_e, id: string) => countFilters(library.reader(id), library.config(id).thresholds))
  ipcMain.handle(IPC.dataPage, (_e, query: GridQuery) =>
    queryPage(library.reader(query.crawlId), query, library.config(query.crawlId).thresholds)
  )
  ipcMain.handle(IPC.dataDetail, (_e, id: string, urlId: number) => getUrlDetail(library.reader(id), urlId))

  registerCompareHandlers(library)
  registerSecretHandlers()
  ipcMain.handle(IPC.dataStructure, (_e, id: string) => getSiteStructure(library.reader(id)))
  ipcMain.handle(IPC.dataDepthStats, (_e, id: string) => getDepthStats(library.reader(id)))
  ipcMain.handle(IPC.dataResponseTimes, (_e, id: string) => getResponseTimes(library.reader(id)))
  ipcMain.handle(IPC.dataApiStatus, (_e, id: string) => getApiStatus(library.reader(id)))
  ipcMain.handle(IPC.dataTree, (_e, id: string, filterKey: string, parentPath: string) =>
    getTreeRows(library.reader(id), filterKey, library.config(id).thresholds, parentPath)
  )
  ipcMain.handle(IPC.appCopyText, (_e, text: string) => clipboard.writeText(String(text)))
  ipcMain.handle(IPC.crawlAnalyse, (_e, id: string) => reanalyseCrawl(library.pathOf(id), library.config(id), manager.isActive(id)))

  ipcMain.handle(IPC.exportTable, async (e, request: ExportRequest): Promise<ExportResult> => {
    const thresholds = library.config(request.crawlId).thresholds
    const label = request.bulkKey
      ? request.bulkKey === ISSUES_REPORT_KEY
        ? 'Issues Overview'
        : (BULK_EXPORTS.find((b) => b.key === request.bulkKey)?.label ?? request.bulkKey)
      : filterExportLabel(request.filterKey ?? 'internal:all', thresholds)
    const window = BrowserWindow.fromWebContents(e.sender)
    const options = {
      defaultPath: `${defaultExportName(label)}.csv`,
      filters: [
        { name: 'CSV', extensions: ['csv'] },
        { name: 'Excel Workbook', extensions: ['xlsx'] }
      ]
    }
    const choice = window ? await dialog.showSaveDialog(window, options) : await dialog.showSaveDialog(options)
    if (choice.canceled || !choice.filePath) return { saved: false, path: null, rows: 0 }
    const db = library.reader(request.crawlId)
    const rows = request.bulkKey
      ? await exportBulk(db, request.bulkKey, thresholds, choice.filePath)
      : await exportFilter(db, request.filterKey ?? 'internal:all', thresholds, choice.filePath)
    return { saved: true, path: choice.filePath, rows }
  })
}
