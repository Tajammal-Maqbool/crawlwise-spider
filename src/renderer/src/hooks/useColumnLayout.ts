import { useCallback, useEffect, useMemo, useState } from 'react'
import { COLUMNS } from '@shared/constants/columns'
import { TABS_BY_KEY } from '@shared/constants/filterRegistry'
import type { ColumnLayoutState, ColumnState } from '../interfaces/columnLayout'
import { mergeColumnLayout, moveColumn, toggleColumn } from '../utils/columnLayout'
import { readStored, writeStored } from '../utils/safeStorage'

export const COLUMN_LAYOUT_PREFIX = 'columns:'

const defaultWidth = (key: string) => COLUMNS[key]?.width ?? 120

export function useColumnLayout(tabKey: string, resetToken: number): ColumnLayoutState {
  const storageKey = `${COLUMN_LAYOUT_PREFIX}${tabKey}`
  const load = useCallback(() => mergeColumnLayout(readStored<ColumnState[]>(storageKey, []), TABS_BY_KEY[tabKey].columns, defaultWidth), [storageKey, tabKey])
  const [columns, setColumns] = useState<ColumnState[]>(load)

  useEffect(() => setColumns(load()), [load, resetToken])

  const save = useCallback(
    (next: ColumnState[]) => {
      setColumns(next)
      writeStored(storageKey, next)
    },
    [storageKey]
  )

  return useMemo(
    () => ({
      columns,
      visible: columns.filter((c) => c.visible).map((c) => c.key),
      widthOf: (key: string) => columns.find((c) => c.key === key)?.width ?? defaultWidth(key),
      resize: (key: string, width: number) => save(columns.map((c) => (c.key === key ? { ...c, width } : c))),
      move: (key: string, beforeKey: string) => save(moveColumn(columns, key, beforeKey)),
      toggle: (key: string) => save(toggleColumn(columns, key))
    }),
    [columns, save]
  )
}
