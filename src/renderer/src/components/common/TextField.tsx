import type { TextFieldProps } from '../../interfaces/fieldProps'

export function TextField({ label, value, hint, onChange }: TextFieldProps) {
  return (
    <label className="field">
      <span>
        {label}
        {hint && <div className="hint">{hint}</div>}
      </span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
