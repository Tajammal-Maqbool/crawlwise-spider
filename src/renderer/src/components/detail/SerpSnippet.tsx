import type { FieldTableProps } from '../../interfaces/detailProps'

const valueOf = (fields: FieldTableProps['fields'], label: string) => fields.find((f) => f.label === label)?.value ?? ''

export function SerpSnippet({ fields }: FieldTableProps) {
  const url = valueOf(fields, 'Address')
  const title = valueOf(fields, 'Title 1')
  const description = valueOf(fields, 'Meta Description 1')
  return (
    <div className="config-section">
      <div style={{ maxWidth: 600, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{url}</div>
        <div style={{ fontSize: 20, color: 'var(--info)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 600 }}>
          {title || '(no title)'}
        </div>
        <div style={{ fontSize: 14, lineHeight: '22px' }}>{description || '(no meta description)'}</div>
      </div>
      <div className="hint">
        Title: {valueOf(fields, 'Title 1 Pixel Width') || 0}px. Description: {valueOf(fields, 'Meta Description 1 Pixel Width') || 0}px.
      </div>
    </div>
  )
}
