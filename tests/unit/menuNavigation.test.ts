import { describe, expect, it } from 'vitest'
import type { MenuDefinition } from '../../src/renderer/src/interfaces/menu'
import { CLOSED_MENU, menuNavReducer } from '../../src/renderer/src/utils/menuNavigation'

const menus: MenuDefinition[] = [
  {
    label: 'File',
    items: [
      { kind: 'item', command: 'a', label: 'A' },
      { kind: 'separator' },
      { kind: 'item', command: 'b', label: 'B', disabled: true },
      { kind: 'item', command: 'c', label: 'C' }
    ]
  },
  { label: 'Mode', items: [{ kind: 'item', command: 'd', label: 'D' }] }
]

const run = (...actions: Parameters<typeof menuNavReducer>[2][]) => actions.reduce((s, a) => menuNavReducer(menus, s, a), CLOSED_MENU)

describe('menu keyboard navigation', () => {
  it('opens the first menu with Alt and closes with Esc', () => {
    expect(run({ type: 'toggle' })).toEqual({ open: 0, active: -1 })
    expect(run({ type: 'toggle' }, { type: 'close' })).toEqual(CLOSED_MENU)
  })

  it('moves between menus and wraps around', () => {
    expect(run({ type: 'toggle' }, { type: 'right' }).open).toBe(1)
    expect(run({ type: 'toggle' }, { type: 'left' }).open).toBe(1)
  })

  it('skips separators and disabled items', () => {
    expect(run({ type: 'toggle' }, { type: 'down' }).active).toBe(0)
    expect(run({ type: 'toggle' }, { type: 'down' }, { type: 'down' }).active).toBe(3)
    expect(run({ type: 'toggle' }, { type: 'down' }, { type: 'down' }, { type: 'down' }).active).toBe(0)
    expect(run({ type: 'toggle' }, { type: 'up' }).active).toBe(3)
  })
})
