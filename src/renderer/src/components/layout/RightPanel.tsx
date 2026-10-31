import { useState } from 'react'
import type { RightPanelProps } from '../../interfaces/layoutProps'
import type { RightTab } from '../../types/uiMode'
import { RIGHT_TABS } from '../../constants/panelTabs'
import { Button } from '../common/Button'
import { OverviewPanel } from '../right/OverviewPanel'
import { IssuesPanel } from '../right/IssuesPanel'
import { CrawlDepthPanel } from '../right/CrawlDepthPanel'
import { ResponseTimesPanel } from '../right/ResponseTimesPanel'
import { ApiPanel } from '../right/ApiPanel'
import { SiteStructureView } from './SiteStructureView'

export function RightPanel(props: RightPanelProps) {
  const [view, setView] = useState<RightTab>('Overview')
  return (
    <aside className="right-panel" aria-label="Overview and issues">
      <div className="panel-tabs" role="tablist">
        {RIGHT_TABS.map((t) => (
          <Button key={t} role="tab" aria-selected={view === t} className={view === t ? 'active' : ''} onClick={() => setView(t)}>
            {t}
          </Button>
        ))}
      </div>
      {view === 'Overview' && <OverviewPanel {...props} />}
      {view === 'Issues' && <IssuesPanel {...props} />}
      {view === 'Site Structure' && <SiteStructureView crawlId={props.crawlId} tick={props.tick} />}
      {view === 'Crawl Depth' && <CrawlDepthPanel crawlId={props.crawlId} tick={props.tick} />}
      {view === 'Response Times' && <ResponseTimesPanel crawlId={props.crawlId} tick={props.tick} />}
      {view === 'API' && <ApiPanel crawlId={props.crawlId} tick={props.tick} />}
    </aside>
  )
}
