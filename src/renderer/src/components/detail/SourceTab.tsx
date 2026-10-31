import type { DetailTabProps } from '../../interfaces/detailProps'

export function SourceTab({ detail }: DetailTabProps) {
  if (!detail.source) return <p className="grid-empty">No stored HTML for this URL.</p>
  if (!detail.renderedSource) return <pre className="source">{detail.source}</pre>
  return (
    <div className="source-compare">
      <section>
        <h4>Original HTML</h4>
        <pre className="source">{detail.source}</pre>
      </section>
      <section>
        <h4>Rendered HTML</h4>
        <pre className="source">{detail.renderedSource}</pre>
      </section>
    </div>
  )
}
