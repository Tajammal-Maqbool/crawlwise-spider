export interface MenuEntry {
  kind: 'item'
  command: string
  label: string
  disabled?: boolean
  checked?: boolean
}

export interface MenuSeparator {
  kind: 'separator'
}

export type MenuItem = MenuEntry | MenuSeparator

export interface MenuDefinition {
  label: string
  items: MenuItem[]
}

export interface MenuContext {
  hasCrawl: boolean
  running: boolean
  mode: string
  theme: string
}

export interface MenuNavState {
  open: number | null
  active: number
}

export type MenuNavAction =
  | { type: 'toggle' }
  | { type: 'open'; menu: number }
  | { type: 'close' }
  | { type: 'left' }
  | { type: 'right' }
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'hover'; item: number }

export interface MenuBarProps {
  menus: MenuDefinition[]
  onCommand: (command: string) => void
}

export interface MenuDropdownProps {
  items: MenuItem[]
  active: number
  onHover: (index: number) => void
  onRun: (command: string) => void
}
