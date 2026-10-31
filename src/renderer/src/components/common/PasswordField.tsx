import type { PasswordFieldProps } from '../../interfaces/fieldProps'

export function PasswordField({ label, value, placeholder, onChange }: PasswordFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="password" autoComplete="off" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
