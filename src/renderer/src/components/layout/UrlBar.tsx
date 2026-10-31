import type { UrlBarProps } from '../../interfaces/layoutProps'
import { crawlPercent } from '../../utils/crawlPercent'
import { Button } from '../common/Button'
import { ProgressBar } from './ProgressBar'

export function UrlBar(props: UrlBarProps) {
  const { config, uiMode, progress, running } = props
  const paused = progress?.state === 'paused'

  return (
    <div className="url-bar">
      {uiMode === 'spider' && (
        <input
          className="url-input"
          type="text"
          placeholder="Enter URL to spider"
          aria-label="Start URL"
          value={config.startUrl}
          disabled={running}
          onChange={(e) => props.onConfigChange({ ...config, startUrl: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !running) props.onStart()
          }}
        />
      )}
      {uiMode === 'list' && (
        <Button className="url-input upload" disabled={running} onClick={props.onOpenList}>
          {config.listUrls.length ? `Upload (${config.listUrls.length.toLocaleString()} URLs in list)` : 'Upload'}
        </Button>
      )}
      {uiMode === 'compare' && (
        <span className="url-input compare-label">
          Compare the open crawl with a previous crawl.
          <Button onClick={props.onOpenCompare}>Select Previous Crawl...</Button>
        </span>
      )}
      {uiMode !== 'compare' && !running && (
        <Button className="primary" onClick={uiMode === 'list' && config.listUrls.length === 0 ? props.onOpenList : props.onStart}>
          Start
        </Button>
      )}
      {running && !paused && <Button onClick={props.onPause}>Pause</Button>}
      {running && paused && (
        <Button className="primary" onClick={props.onResume}>
          Resume
        </Button>
      )}
      <Button onClick={props.onClear}>Clear</Button>
      <ProgressBar percent={crawlPercent(progress)} />
    </div>
  )
}
