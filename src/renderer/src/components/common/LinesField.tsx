import { useState } from 'react'
import type { LinesFieldProps } from '../../interfaces/fieldProps'

export function LinesField({ label, value, hint, onChange }: LinesFieldProps) {
  const [text, setText] = useState(value.join('\n'))
  const commit = () =>
    onChange(
      text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    )
  return (
    <label className="field">
      <span>
        {label}
        {hint && <div className="hint">{hint}</div>}
      </span>
      <textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} />
    </label>
  )
}
