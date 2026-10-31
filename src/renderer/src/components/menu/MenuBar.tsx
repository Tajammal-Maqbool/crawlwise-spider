import { useEffect, useReducer, useRef } from 'react'
import type { MenuBarProps, MenuNavAction, MenuNavState } from '../../interfaces/menu'
import { CLOSED_MENU, menuNavReducer } from '../../utils/menuNavigation'
import { Button } from '../common/Button'
import { MenuDropdown } from './MenuDropdown'

const KEY_ACTIONS: Record<string, MenuNavAction['type']> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Escape: 'close' }

export function MenuBar({ menus, onCommand }: MenuBarProps) {
  const [state, dispatch] = useReducer((s: MenuNavState, a: MenuNavAction) => menuNavReducer(menus, s, a), CLOSED_MENU)
  const ref = useRef<HTMLElement>(null)

  const run = (command: string) => {
    dispatch({ type: 'close' })
    onCommand(command)
  }

  useEffect(() => {
    let altAlone = false
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altAlone = true
        e.preventDefault()
        return
      }
      altAlone = false
      if (state.open === null) return
      const action = KEY_ACTIONS[e.key]
      if (action) {
        e.preventDefault()
        dispatch({ type: action } as MenuNavAction)
      } else if (e.key === 'Enter') {
        const item = menus[state.open].items[state.active]
        if (item?.kind === 'item' && !item.disabled) {
          e.preventDefault()
          run(item.command)
        }
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && altAlone) dispatch({ type: 'toggle' })
    }
    const outside = (e: MouseEvent) => {
      if (state.open !== null && ref.current && !ref.current.contains(e.target as Node)) dispatch({ type: 'close' })
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('mousedown', outside)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('mousedown', outside)
    }
  })

  return (
    <nav className="menu-bar" aria-label="Main menu" ref={ref}>
      {menus.map((menu, i) => (
        <div key={menu.label} className="menu-root">
          <Button
            className={`menu-title ${state.open === i ? 'open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={state.open === i}
            onClick={() => dispatch(state.open === i ? { type: 'close' } : { type: 'open', menu: i })}
            onMouseEnter={() => state.open !== null && state.open !== i && dispatch({ type: 'open', menu: i })}
          >
            {menu.label}
          </Button>
          {state.open === i && <MenuDropdown items={menu.items} active={state.active} onHover={(item) => dispatch({ type: 'hover', item })} onRun={run} />}
        </div>
      ))}
    </nav>
  )
}
