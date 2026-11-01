export interface ColumnState {
  key: string
  width: number
  visible: boolean
}

export interface ColumnLayoutState {
  columns: ColumnState[]
  visible: string[]
  widthOf: (key: string) => number
  resize: (key: string, width: number) => void
  persist: () => void
  move: (key: string, beforeKey: string) => void
  toggle: (key: string) => void
}
