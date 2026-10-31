import type { NumberFieldProps } from '../../interfaces/fieldProps'

export function NumberField({ label, value, min = 0, hint, onChange }: NumberFieldProps) {
  return (
    <label className="field">
      <span>
        {label}
        {hint && <div className="hint">{hint}</div>}
      </span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(n)
        }}
      />
    </label>
  )
}
