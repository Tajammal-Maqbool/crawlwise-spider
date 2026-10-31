import type { DetailTabProps } from '../../interfaces/detailProps'

export function RenderedPageTab({ detail, config }: DetailTabProps) {
  if (detail.screenshot) return <img className="rendered-shot" src={detail.screenshot} alt={`Rendered screenshot of ${detail.url}`} />
  const reason = config.rendering.mode !== 'javascript' ? 'Set Rendering to JavaScript in Spider: Rendering.' : 'Turn on Rendered Page Screenshots in Spider: Rendering.'
  return <p className="grid-empty">No screenshot for this URL. {reason}</p>
}
