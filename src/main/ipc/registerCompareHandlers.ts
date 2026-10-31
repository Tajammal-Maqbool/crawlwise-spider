import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipcChannels'
import { FILTERS_BY_KEY } from '@shared/constants/filterRegistry'
import type { CrawlComparison, DiffCategory } from '@shared/interfaces/crawlComparison'
import { compareFields, compareFilters, diffUrls, fieldChanges } from '../db/compareService'
import type { CrawlLibrary } from '../services/crawlLibrary'

export function registerCompareHandlers(library: CrawlLibrary): void {
  ipcMain.handle(IPC.compareFilters, (_e, currentId: string, previousId: string): CrawlComparison => {
    const current = library.reader(currentId)
    const previous = library.reader(previousId)
    return {
      currentId,
      previousId,
      filters: compareFilters(current, previous, library.config(currentId).thresholds),
      changes: compareFields(current, previous)
    }
  })
  ipcMain.handle(IPC.compareUrls, (_e, currentId: string, previousId: string, filterKey: string, category: DiffCategory) => {
    const filter = FILTERS_BY_KEY[filterKey]
    if (!filter) throw new Error(`Unknown filter: ${filterKey}`)
    return diffUrls(library.reader(currentId), library.reader(previousId), filter.where(library.config(currentId).thresholds))[category]
  })
  ipcMain.handle(IPC.compareChanges, (_e, currentId: string, previousId: string, field: string) =>
    fieldChanges(library.reader(currentId), library.reader(previousId), field)
  )
}
