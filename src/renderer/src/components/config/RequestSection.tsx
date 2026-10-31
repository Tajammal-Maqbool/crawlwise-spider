import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { TextField } from '../common/TextField'
import { LinesField } from '../common/LinesField'

export function RequestSection({ config, onChange }: ConfigSectionProps) {
  const headerLines = Object.entries(config.extraHeaders).map(([k, v]) => `${k}: ${v}`)
  return (
    <div className="config-section">
      <h3>User-Agent and HTTP Headers</h3>
      <TextField label="User-Agent" value={config.userAgent} onChange={(v) => onChange({ ...config, userAgent: v })} />
      <LinesField
        label="Custom HTTP Headers"
        hint="One per line, as Name: Value"
        value={headerLines}
        onChange={(lines) =>
          onChange({
            ...config,
            extraHeaders: Object.fromEntries(
              lines
                .map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()])
                .filter(([k]) => k.length > 0)
            )
          })
        }
      />
    </div>
  )
}
