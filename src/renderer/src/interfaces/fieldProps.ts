import type { GoogleProperty } from '@shared/interfaces/googleAccount'

export interface NumberFieldProps {
  label: string
  value: number
  min?: number
  hint?: string
  onChange: (value: number) => void
}

export interface CheckFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export interface TextFieldProps {
  label: string
  value: string
  hint?: string
  onChange: (value: string) => void
}

export interface LinesFieldProps {
  label: string
  value: string[]
  hint?: string
  onChange: (value: string[]) => void
}

export interface SelectOption<T extends string> {
  value: T
  label: string
}

export interface SelectFieldProps<T extends string> {
  label: string
  value: T
  options: Array<SelectOption<T>>
  hint?: string
  onChange: (value: T) => void
}

export interface PasswordFieldProps {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export interface ComboFieldProps {
  label: string
  value: string
  options: GoogleProperty[]
  hint?: string
  placeholder?: string
  loadLabel: string
  loading: boolean
  onLoad: () => void
  onChange: (value: string) => void
}
