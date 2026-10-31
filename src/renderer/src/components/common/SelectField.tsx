import type { SelectFieldProps } from '../../interfaces/fieldProps'

export function SelectField<T extends string>({ label, value, options, hint, onChange }: SelectFieldProps<T>) {
  return (
    <label className="field">
      <span>
        {label}
        {hint && <div className="hint">{hint}</div>}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
