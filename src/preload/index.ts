import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC } from '@shared/constants/ipcChannels'
import type { SpiderApi } from '@shared/interfaces/spiderApi'
import type { CrawlProgress } from '@shared/interfaces/crawlProgress'

const api: SpiderApi = {
  startCrawl: (config) => ipcRenderer.invoke(IPC.crawlStart, config),
  pauseCrawl: () => ipcRenderer.invoke(IPC.crawlPause),
  resumeCrawl: () => ipcRenderer.invoke(IPC.crawlResume),
  stopCrawl: () => ipcRenderer.invoke(IPC.crawlStop),
  continueCrawl: (id) => ipcRenderer.invoke(IPC.crawlContinue, id),
  listCrawls: () => ipcRenderer.invoke(IPC.crawlList),
  deleteCrawl: (id) => ipcRenderer.invoke(IPC.crawlDelete, id),
  getCrawlConfig: (id) => ipcRenderer.invoke(IPC.crawlConfig, id),
  getCounts: (id) => ipcRenderer.invoke(IPC.dataCounts, id),
  getPage: (query) => ipcRenderer.invoke(IPC.dataPage, query),
  getDetail: (id, urlId) => ipcRenderer.invoke(IPC.dataDetail, id, urlId),
  getSiteStructure: (id) => ipcRenderer.invoke(IPC.dataStructure, id),
  compareCrawls: (cur, prev) => ipcRenderer.invoke(IPC.compareFilters, cur, prev),
  compareUrls: (cur, prev, key, category) => ipcRenderer.invoke(IPC.compareUrls, cur, prev, key, category),
  compareChanges: (cur, prev, field) => ipcRenderer.invoke(IPC.compareChanges, cur, prev, field),
  listSchedules: () => ipcRenderer.invoke(IPC.scheduleList),
  createSchedule: (input, config) => ipcRenderer.invoke(IPC.scheduleCreate, input, config),
  deleteSchedule: (id) => ipcRenderer.invoke(IPC.scheduleDelete, id),
  exportTable: (request) => ipcRenderer.invoke(IPC.exportTable, request),
  analyseCrawl: (id) => ipcRenderer.invoke(IPC.crawlAnalyse, id),
  copyText: (text) => ipcRenderer.invoke(IPC.appCopyText, text),
  getDepthStats: (id) => ipcRenderer.invoke(IPC.dataDepthStats, id),
  getResponseTimes: (id) => ipcRenderer.invoke(IPC.dataResponseTimes, id),
  getApiStatus: (id) => ipcRenderer.invoke(IPC.dataApiStatus, id),
  getTreeRows: (id, filterKey, parentPath) => ipcRenderer.invoke(IPC.dataTree, id, filterKey, parentPath),
  googleStatus: () => ipcRenderer.invoke(IPC.googleStatus),
  connectGoogle: (clientId, clientSecret) => ipcRenderer.invoke(IPC.googleConnect, clientId, clientSecret),
  disconnectGoogle: () => ipcRenderer.invoke(IPC.googleDisconnect),
  listSearchConsoleSites: () => ipcRenderer.invoke(IPC.googleSites),
  listAnalyticsProperties: () => ipcRenderer.invoke(IPC.googleProperties),
  getSecrets: () => ipcRenderer.invoke(IPC.secretsGet),
  saveSecrets: (secrets) => ipcRenderer.invoke(IPC.secretsSave, secrets),
  onProgress: (listener) => {
    const handler = (_e: IpcRendererEvent, progress: CrawlProgress) => listener(progress)
    ipcRenderer.on(IPC.crawlProgress, handler)
    return () => ipcRenderer.removeListener(IPC.crawlProgress, handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
