import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { NumberField } from '../common/NumberField'

export function SpeedSection({ config, onChange }: ConfigSectionProps) {
  return (
    <div className="config-section">
      <h3>Speed</h3>
      <NumberField label="Max Threads" value={config.speed.maxThreads} min={1} onChange={(v) => onChange({ ...config, speed: { ...config.speed, maxThreads: Math.max(1, Math.min(v, 50)) } })} />
      <NumberField
        label="Max URI/s"
        hint="0 means no limit"
        value={config.speed.maxUrlsPerSecond}
        onChange={(v) => onChange({ ...config, speed: { ...config.speed, maxUrlsPerSecond: v } })}
      />
    </div>
  )
}
