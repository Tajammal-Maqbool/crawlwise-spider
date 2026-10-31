import type { SelectModifiers, SelectionState } from '../interfaces/selection'

export const EMPTY_SELECTION: SelectionState = { indices: new Set(), anchor: null }

export function selectRow(state: SelectionState, index: number, mods: SelectModifiers): SelectionState {
  if (mods.shift && state.anchor !== null) {
    const [from, to] = state.anchor < index ? [state.anchor, index] : [index, state.anchor]
    const indices = new Set(mods.toggle ? state.indices : [])
    for (let i = from; i <= to; i += 1) indices.add(i)
    return { indices, anchor: state.anchor }
  }
  if (mods.toggle) {
    const indices = new Set(state.indices)
    if (indices.has(index)) indices.delete(index)
    else indices.add(index)
    return { indices, anchor: index }
  }
  return { indices: new Set([index]), anchor: index }
}
