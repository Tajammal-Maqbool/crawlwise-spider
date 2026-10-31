import type { RenderingMode } from '@shared/interfaces/crawlConfig'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { NumberField } from '../common/NumberField'
import { CheckField } from '../common/CheckField'

export function RenderingSection({ config, onChange }: ConfigSectionProps) {
  const set = (patch: Partial<typeof config.rendering>) => onChange({ ...config, rendering: { ...config.rendering, ...patch } })
  return (
    <div className="config-section">
      <h3>Rendering</h3>
      <label className="field">
        <span>Rendering</span>
        <select value={config.rendering.mode} onChange={(e) => set({ mode: e.target.value as RenderingMode })}>
          <option value="text">Text Only</option>
          <option value="javascript">JavaScript</option>
        </select>
      </label>
      <NumberField label="AJAX Timeout (seconds)" value={config.rendering.timeoutMs / 1000} min={1} onChange={(v) => set({ timeoutMs: Math.max(1, v) * 1000 })} />
      <NumberField label="Rendering Windows" hint="Pages rendered at the same time" value={config.rendering.maxWindows} min={1} onChange={(v) => set({ maxWindows: Math.min(8, Math.max(1, v)) })} />
      <CheckField label="Accessibility (axe-core) on rendered pages" checked={config.rendering.accessibility} onChange={(v) => set({ accessibility: v })} />
      <CheckField label="Enable Rendered Page Screenshots" checked={config.rendering.screenshots} onChange={(v) => set({ screenshots: v })} />
      <p className="hint">JavaScript rendering runs in the desktop app only. The CLI crawls raw HTML.</p>
    </div>
  )
}
