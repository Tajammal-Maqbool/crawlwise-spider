import type { DetailPaneProps } from '../../interfaces/dialogProps'
import { DETAIL_TABS } from '../../constants/panelTabs'
import { Button } from '../common/Button'
import { FieldTable } from './FieldTable'
import { LinkTable } from './LinkTable'
import { HeaderTable } from './HeaderTable'
import { SerpSnippet } from './SerpSnippet'
import { AccessibilityTab } from './AccessibilityTab'
import { ConsoleLogTab } from './ConsoleLogTab'
import { CookiesTab } from './CookiesTab'
import { DuplicatesTab } from './DuplicatesTab'
import { LighthouseTab } from './LighthouseTab'
import { RenderedPageTab } from './RenderedPageTab'
import { SourceTab } from './SourceTab'
import { StructuredDataTab } from './StructuredDataTab'

export function DetailPane({ detail, loading, error, config, tab, onTabChange }: DetailPaneProps) {
  const body = () => {
    if (error) return <div className="error-banner">{error}</div>
    if (loading) return <p className="grid-empty">Loading URL details...</p>
    if (!detail) return <p className="grid-empty">Select a URL in the table to see its details.</p>
    const props = { detail, config }
    switch (tab) {
      case 'URL Details':
        return <FieldTable fields={detail.fields} />
      case 'Inlinks':
        return <LinkTable links={detail.inlinks} />
      case 'Outlinks':
        return <LinkTable links={detail.outlinks} />
      case 'Image Details':
        return <LinkTable links={detail.images} />
      case 'Resources':
        return <LinkTable links={detail.resources} />
      case 'SERP Snippet':
        return <SerpSnippet fields={detail.fields} />
      case 'Rendered Page':
        return <RenderedPageTab {...props} />
      case 'Chrome Console Log':
        return <ConsoleLogTab {...props} />
      case 'View Source':
        return <SourceTab {...props} />
      case 'HTTP Headers':
        return <HeaderTable headers={detail.headers} />
      case 'Cookies':
        return <CookiesTab {...props} />
      case 'Duplicate Details':
        return <DuplicatesTab {...props} />
      case 'Structured Data Details':
        return <StructuredDataTab {...props} />
      case 'Accessibility Details':
        return <AccessibilityTab {...props} />
      case 'Lighthouse Details':
        return <LighthouseTab {...props} />
    }
  }
  return (
    <section className="detail" aria-label="URL details">
      <div className="panel-tabs detail-tabs" role="tablist">
        {DETAIL_TABS.map((t) => (
          <Button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => onTabChange(t)}>
            {t}
          </Button>
        ))}
      </div>
      <div className="detail-body">{body()}</div>
    </section>
  )
}
