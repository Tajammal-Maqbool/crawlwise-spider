import type { ProgressBarProps } from '../../interfaces/layoutProps'

export function ProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Crawl progress">
      <div className="progress-bar">
        <div style={{ width: `${percent}%` }} />
      </div>
      <span>{percent}%</span>
    </div>
  )
}
