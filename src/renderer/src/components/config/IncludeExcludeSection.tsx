import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { LinesField } from '../common/LinesField'
import { invalidPatterns } from '../../utils/invalidPatterns'

export function IncludeExcludeSection({ config, onChange }: ConfigSectionProps) {
  const invalid = invalidPatterns([...config.includePatterns, ...config.excludePatterns])
  return (
    <div className="config-section">
      <h3>Include and Exclude</h3>
      <p className="hint">One regular expression per line. A URL is crawled only if it matches an include pattern (when any exist) and no exclude pattern.</p>
      <LinesField label="Include" value={config.includePatterns} onChange={(v) => onChange({ ...config, includePatterns: v })} />
      <LinesField label="Exclude" value={config.excludePatterns} onChange={(v) => onChange({ ...config, excludePatterns: v })} />
      {invalid.length > 0 && <div className="error-banner">Invalid regex: {invalid.join(', ')}</div>}
    </div>
  )
}
