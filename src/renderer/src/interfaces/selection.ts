export interface SelectionState {
  indices: Set<number>
  anchor: number | null
}

export interface SelectModifiers {
  shift: boolean
  toggle: boolean
}
