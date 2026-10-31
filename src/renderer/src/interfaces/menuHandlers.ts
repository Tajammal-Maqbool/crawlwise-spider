import type { Theme } from '../types/theme'
import type { UiMode } from '../types/uiMode'

export interface MenuHandlers {
  clear: () => void
  crawls: () => void
  schedule: () => void
  exit: () => void
  mode: (mode: UiMode) => void
  config: (section: string) => void
  exportKey: (key: string) => void
  analyse: () => void
  theme: (theme: Theme) => void
  resetColumns: () => void
  about: () => void
}
