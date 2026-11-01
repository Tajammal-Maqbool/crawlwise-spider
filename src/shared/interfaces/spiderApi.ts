import type { CrawlConfig } from './crawlConfig'
import type { CrawlProgress } from './crawlProgress'
import type { CrawlSummary } from './crawlSummary'
import type { ExportRequest, ExportResult } from './exportRequest'
import type { FilterCounts } from './filterCount'
import type { GridPage, GridQuery } from './gridQuery'
import type { UrlDetail } from './urlDetail'
import type { SiteStructure } from './siteStructure'
import type { ScheduledTask, ScheduledTaskInput } from './scheduledTask'
import type { ChangeRow, CrawlComparison, DiffCategory } from './crawlComparison'
import type { SecretsStatus, StoredSecrets } from './storedSecrets'
import type { GoogleAccountStatus, GoogleProperty } from './googleAccount'
import type { ApiStatusRow, DepthStat, ResponseTimeStats } from './crawlStats'
import type { TreeRow } from './treeRow'

export interface SpiderApi {
  startCrawl(config: CrawlConfig): Promise<string>
  pauseCrawl(): Promise<void>
  resumeCrawl(): Promise<void>
  stopCrawl(): Promise<void>
  continueCrawl(crawlId: string): Promise<void>
  listCrawls(): Promise<CrawlSummary[]>
  deleteCrawl(crawlId: string): Promise<void>
  getCrawlConfig(crawlId: string): Promise<CrawlConfig>
  getCounts(crawlId: string): Promise<FilterCounts>
  getPage(query: GridQuery): Promise<GridPage>
  getDetail(crawlId: string, urlId: number): Promise<UrlDetail>
  getSiteStructure(crawlId: string): Promise<SiteStructure>
  compareCrawls(currentId: string, previousId: string): Promise<CrawlComparison>
  compareUrls(currentId: string, previousId: string, filterKey: string, category: DiffCategory): Promise<string[]>
  compareChanges(currentId: string, previousId: string, field: string): Promise<ChangeRow[]>
  listSchedules(): Promise<ScheduledTask[]>
  createSchedule(input: ScheduledTaskInput, config: CrawlConfig): Promise<ScheduledTask>
  deleteSchedule(id: string): Promise<void>
  exportTable(request: ExportRequest): Promise<ExportResult>
  analyseCrawl(crawlId: string): Promise<void>
  copyText(text: string): Promise<void>
  getDepthStats(crawlId: string): Promise<DepthStat[]>
  getResponseTimes(crawlId: string): Promise<ResponseTimeStats>
  getApiStatus(crawlId: string): Promise<ApiStatusRow[]>
  getTreeRows(crawlId: string, filterKey: string, parentPath: string): Promise<TreeRow[]>
  googleStatus(): Promise<GoogleAccountStatus>
  connectGoogle(clientId: string, clientSecret: string): Promise<GoogleAccountStatus>
  disconnectGoogle(): Promise<GoogleAccountStatus>
  listSearchConsoleSites(): Promise<GoogleProperty[]>
  listAnalyticsProperties(): Promise<GoogleProperty[]>
  getSecrets(): Promise<SecretsStatus>
  saveSecrets(secrets: StoredSecrets): Promise<SecretsStatus>
  onProgress(listener: (progress: CrawlProgress) => void): () => void
}
