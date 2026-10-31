import type { MenuDefinition, MenuNavAction, MenuNavState } from '../interfaces/menu'

export const CLOSED_MENU: MenuNavState = { open: null, active: -1 }

const usable = (menu: MenuDefinition, i: number) => {
  const item = menu.items[i]
  return item?.kind === 'item' && !item.disabled
}

function step(menu: MenuDefinition, from: number, delta: number): number {
  const n = menu.items.length
  for (let k = 1; k <= n; k += 1) {
    const i = (((from + delta * k) % n) + n) % n
    if (usable(menu, i)) return i
  }
  return -1
}

export function menuNavReducer(menus: MenuDefinition[], state: MenuNavState, action: MenuNavAction): MenuNavState {
  const count = menus.length
  switch (action.type) {
    case 'toggle':
      return state.open === null ? { open: 0, active: -1 } : CLOSED_MENU
    case 'open':
      return { open: action.menu, active: -1 }
    case 'close':
      return CLOSED_MENU
    case 'left':
    case 'right': {
      if (state.open === null) return state
      const open = (state.open + (action.type === 'left' ? -1 : 1) + count) % count
      return { open, active: -1 }
    }
    case 'up':
    case 'down': {
      if (state.open === null) return state
      const menu = menus[state.open]
      return { ...state, active: step(menu, state.active < 0 && action.type === 'up' ? 0 : state.active, action.type === 'up' ? -1 : 1) }
    }
    case 'hover':
      return state.open === null ? state : { ...state, active: action.item }
  }
}
