import { useEffect, useMemo, useState } from 'react'
import { FILTERS_BY_KEY } from '@shared/constants/filterRegistry'
import { BULK_EXPORTS, ISSUES_REPORT_KEY } from '@shared/constants/bulkExports'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import type { CrawlSummary } from '@shared/interfaces/crawlSummary'
import type { SortDirection } from '@shared/types/sortDirection'
import { api } from './services/ipc/api'
import { ipcErrorMessage } from './utils/ipcErrorMessage'
import { buildMenus } from './utils/buildMenus'
import { clearStoredPrefix } from './utils/safeStorage'
import { useCrawlProgress } from './hooks/useCrawlProgress'
import { useRefreshTick } from './hooks/useRefreshTick'
import { useFilterCounts } from './hooks/useFilterCounts'
import { useGridPage } from './hooks/useGridPage'
import { useUrlDetail } from './hooks/useUrlDetail'
import { useStoredConfig } from './hooks/useStoredConfig'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { SEARCH_DEBOUNCE_MS } from './constants/searchDebounce'
import { SECRETS_NOT_SAVED_MESSAGE } from './constants/secretMessages'
import { useTheme } from './hooks/useTheme'
import { COLUMN_LAYOUT_PREFIX, useColumnLayout } from './hooks/useColumnLayout'
import { useMenuCommands } from './hooks/useMenuCommands'
import type { MenuHandlers } from './interfaces/menuHandlers'
import type { DetailTab, GridView, UiMode } from './types/uiMode'
import { MenuBar } from './components/menu/MenuBar'
import { UrlBar } from './components/layout/UrlBar'
import { MainTabStrip } from './components/layout/MainTabStrip'
import { GridToolbar } from './components/layout/GridToolbar'
import { RightPanel } from './components/layout/RightPanel'
import { StatusBar } from './components/layout/StatusBar'
import { Splitter, restoreSplitSizes } from './components/layout/Splitter'
import { DataGrid } from './components/grid/DataGrid'
import { TreeGrid } from './components/grid/TreeGrid'
import { DetailPane } from './components/detail/DetailPane'
import { ConfigDialog } from './components/config/ConfigDialog'
import { CrawlListDialog } from './components/dialogs/CrawlListDialog'
import { ListModeDialog } from './components/dialogs/ListModeDialog'
import { CompareDialog } from './components/dialogs/CompareDialog'
import { ScheduleDialog } from './components/dialogs/ScheduleDialog'
import { AboutDialog } from './components/dialogs/AboutDialog'

type Dialog = 'none' | 'config' | 'crawls' | 'list' | 'compare' | 'schedule' | 'about'
const LIVE_STATES = new Set(['crawling', 'paused', 'analysing'])
const MODE_LABELS: Record<UiMode, string> = { spider: 'Spider', list: 'List', compare: 'Compare' }

export function App() {
  const { config, setConfig, secretsPersistent } = useStoredConfig()
  const [theme, setTheme] = useTheme()
  const [uiMode, setUiMode] = useState<UiMode>(config.mode === 'list' ? 'list' : 'spider')
  const [crawlId, setCrawlId] = useState<string | null>(null)
  const [viewConfig, setViewConfig] = useState<CrawlConfig>(config)
  const [filterKey, setFilterKey] = useState('internal:all')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialog, setDialog] = useState<Dialog>('none')
  const [configSection, setConfigSection] = useState('crawl')
  const [gridView, setGridView] = useState<GridView>('list')
  const [detailTab, setDetailTab] = useState<DetailTab>('URL Details')
  const [columnReset, setColumnReset] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const rawProgress = useCrawlProgress()
  const progress = rawProgress && rawProgress.crawlId === crawlId ? rawProgress : null
  const running = !!rawProgress && LIVE_STATES.has(rawProgress.state)
  const live = !!progress && LIVE_STATES.has(progress.state)
  const tick = useRefreshTick(live, `${crawlId}:${progress?.state ?? ''}`) + refresh
  const counts = useFilterCounts(crawlId, tick)
  const tabKey = FILTERS_BY_KEY[filterKey].tabKey
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const grid = useGridPage({ crawlId, filterKey, sortKey, sortDirection, search: debouncedSearch, tick })
  const detail = useUrlDetail(crawlId, selectedId)
  const layout = useColumnLayout(tabKey, columnReset)

  useEffect(() => restoreSplitSizes({ '--right-w': 340, '--detail-h': 260 }), [])

  const guard = async (action: () => Promise<unknown>) => {
    try {
      setError(null)
      await action()
    } catch (err) {
      setError(ipcErrorMessage(err))
    }
  }

  const start = (next: CrawlConfig) =>
    guard(async () => {
      if (next.mode === 'spider' && !/^https?:\/\//i.test(next.startUrl.trim())) {
        const fixed = { ...next, startUrl: `https://${next.startUrl.trim()}` }
        setConfig(fixed)
        next = fixed
      }
      const id = await api.startCrawl(next)
      setViewConfig(next)
      setCrawlId(id)
      setSelectedId(null)
    })

  const openCrawl = (crawl: CrawlSummary, resume: boolean) =>
    guard(async () => {
      setViewConfig(await api.getCrawlConfig(crawl.id))
      setCrawlId(crawl.id)
      setSelectedId(null)
      setDialog('none')
      if (resume) await api.continueCrawl(crawl.id)
    })

  const selectFilter = (key: string) => {
    if (FILTERS_BY_KEY[key].tabKey !== tabKey) setSortKey(null)
    setFilterKey(key)
    setSelectedId(null)
  }

  const sort = (key: string) => {
    if (sortKey === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const exportKey = (key: string) =>
    guard(async () => {
      if (!crawlId) return
      const label = key === ISSUES_REPORT_KEY ? 'Issues Overview' : (BULK_EXPORTS.find((b) => b.key === key)?.label ?? key)
      const result = await api.exportTable({ crawlId, bulkKey: key })
      setNotice(result.saved ? `${label}: saved ${result.rows.toLocaleString()} rows to ${result.path}` : null)
    })

  const clear = () => {
    if (running) return void guard(api.stopCrawl)
    setCrawlId(null)
    setSelectedId(null)
    setNotice(null)
  }

  const handlers = useMemo<MenuHandlers>(
    () => ({
      clear,
      crawls: () => setDialog('crawls'),
      schedule: () => setDialog('schedule'),
      exit: () => window.close(),
      mode: (mode) => {
        setUiMode(mode)
        if (mode === 'compare') setDialog('compare')
        else setConfig({ ...config, mode })
      },
      config: (section) => {
        setConfigSection(section)
        setDialog('config')
      },
      exportKey: (key) => void exportKey(key),
      analyse: () =>
        void guard(async () => {
          if (!crawlId) return
          await api.analyseCrawl(crawlId)
          setRefresh((n) => n + 1)
          setNotice('Crawl Analysis is complete.')
        }),
      theme: setTheme,
      resetColumns: () => {
        clearStoredPrefix(COLUMN_LAYOUT_PREFIX)
        setColumnReset((n) => n + 1)
      },
      about: () => setDialog('about')
    }),
    [config, crawlId, running]
  )
  const onCommand = useMenuCommands(handlers)
  const menus = useMemo(() => buildMenus({ hasCrawl: !!crawlId, running, mode: uiMode, theme }), [crawlId, running, uiMode, theme])

  const crawlLabel = useMemo(() => (crawlId ? viewConfig.startUrl || `${viewConfig.listUrls.length} URLs (list)` : null), [crawlId, viewConfig])

  return (
    <div className="app">
      <MenuBar menus={menus} onCommand={onCommand} />
      <UrlBar
        config={config}
        uiMode={uiMode}
        progress={progress}
        running={running}
        onConfigChange={setConfig}
        onStart={() => void start({ ...config, mode: uiMode === 'list' ? 'list' : 'spider' })}
        onPause={() => void guard(api.pauseCrawl)}
        onResume={() => void guard(api.resumeCrawl)}
        onClear={clear}
        onOpenList={() => setDialog('list')}
        onOpenCompare={() => crawlId && setDialog('compare')}
      />
      <div className="workspace">
        <div className="center">
          <MainTabStrip selectedTab={tabKey} onSelectTab={(key) => selectFilter(`${key}:all`)} />
          <div>
            {error && <div className="error-banner">{error}</div>}
            {notice && <div className="info-banner">{notice}</div>}
            {!secretsPersistent && <div className="info-banner">{SECRETS_NOT_SAVED_MESSAGE}</div>}
            <GridToolbar
              filterKey={filterKey}
              config={viewConfig}
              counts={counts}
              total={grid.total}
              search={search}
              view={gridView}
              canExport={!!crawlId}
              onFilterChange={selectFilter}
              onSearchChange={setSearch}
              onViewChange={setGridView}
              onExport={() => crawlId && void guard(() => api.exportTable({ crawlId, filterKey }))}
            />
          </div>
          {gridView === 'tree' ? (
            <TreeGrid crawlId={crawlId} filterKey={filterKey} tick={tick} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <DataGrid
              data={grid}
              layout={layout}
              selectedId={selectedId}
              sortKey={sortKey}
              sortDirection={sortDirection}
              emptyText={crawlId ? 'No URLs match this filter.' : 'Enter a URL above and press Start to crawl a site.'}
              onSelect={setSelectedId}
              onSort={sort}
              onShowLinks={setDetailTab}
            />
          )}
          <Splitter orientation="horizontal" cssVar="--detail-h" min={120} max={700} invert />
          <DetailPane detail={detail.data} loading={detail.loading} error={detail.error} config={viewConfig} tab={detailTab} onTabChange={setDetailTab} />
        </div>
        <Splitter orientation="vertical" cssVar="--right-w" min={220} max={700} invert />
        <RightPanel counts={counts} config={viewConfig} crawlId={crawlId} tick={tick} onSelectFilter={selectFilter} />
      </div>
      <StatusBar progress={progress} crawlLabel={crawlLabel} modeLabel={MODE_LABELS[uiMode]} />

      {dialog === 'config' && (
        <ConfigDialog
          config={config}
          initialSection={configSection}
          onClose={() => setDialog('none')}
          onSave={(next) => {
            setConfig(next)
            setDialog('none')
          }}
        />
      )}
      {dialog === 'crawls' && (
        <CrawlListDialog
          activeCrawlId={rawProgress?.crawlId ?? null}
          running={running}
          onClose={() => setDialog('none')}
          onOpen={(c) => void openCrawl(c, false)}
          onContinue={(c) => void openCrawl(c, true)}
        />
      )}
      {dialog === 'compare' && crawlId && <CompareDialog crawlId={crawlId} config={viewConfig} onClose={() => setDialog('none')} />}
      {dialog === 'schedule' && <ScheduleDialog config={config} onClose={() => setDialog('none')} />}
      {dialog === 'about' && <AboutDialog onClose={() => setDialog('none')} />}
      {dialog === 'list' && (
        <ListModeDialog
          initial={config.listUrls}
          onClose={() => setDialog('none')}
          onStart={(urls) => {
            const next = { ...config, mode: 'list' as const, listUrls: urls }
            setConfig(next)
            setUiMode('list')
            setDialog('none')
            void start(next)
          }}
        />
      )}
    </div>
  )
}
