import { useId } from 'react'
import type { ComboFieldProps } from '../../interfaces/fieldProps'
import { Button } from './Button'

export function ComboField({ label, value, options, hint, placeholder, loadLabel, loading, onLoad, onChange }: ComboFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {hint && <div className="hint">{hint}</div>}
      </label>
      <span className="combo">
        <input id={id} type="text" list={`${id}-list`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        <datalist id={`${id}-list`}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </datalist>
        <Button disabled={loading} onClick={onLoad}>
          {loadLabel}
        </Button>
      </span>
    </div>
  )
}
