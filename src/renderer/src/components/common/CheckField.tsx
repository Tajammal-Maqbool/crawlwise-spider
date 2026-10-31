import type { CheckFieldProps } from '../../interfaces/fieldProps'

export function CheckField({ label, checked, onChange }: CheckFieldProps) {
  return (
    <label className="field check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}
