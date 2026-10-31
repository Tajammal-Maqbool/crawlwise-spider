import type { StatusBarProps } from '../../interfaces/layoutProps'
import { crawlPercent } from '../../utils/crawlPercent'
import { formatBytes } from '../../utils/formatCell'

const STATE_LABELS: Record<string, string> = {
  idle: 'Idle',
  crawling: 'Active',
  paused: 'Paused',
  analysing: 'Analysing',
  completed: 'Completed',
  stopped: 'Stopped',
  failed: 'Failed'
}

export function StatusBar({ progress, crawlLabel, modeLabel }: StatusBarProps) {
  const total = progress ? progress.crawled + progress.queued : 0
  return (
    <footer className="status-bar">
      <span>
        {modeLabel} Mode: <span className="state">{STATE_LABELS[progress?.state ?? 'idle']}</span>
      </span>
      <span>Average: {progress?.urlsPerSecond ?? 0} URL/s</span>
      <span>
        Completed {(progress?.crawled ?? 0).toLocaleString()} of {total.toLocaleString()} ({crawlPercent(progress)}%)
      </span>
      <span>Remaining: {(progress?.queued ?? 0).toLocaleString()}</span>
      <span>Threads: {progress?.activeThreads ?? 0}</span>
      <span>Database: {formatBytes(progress?.dbSizeBytes ?? 0)}</span>
      {crawlLabel && <span className="crawl-name">{crawlLabel}</span>}
      {progress?.message && <span className="message">{progress.message}</span>}
    </footer>
  )
}
