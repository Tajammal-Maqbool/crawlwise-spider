import { useCallback } from 'react'
import { MENU_COMMANDS as C } from '../constants/menus'
import type { MenuHandlers } from '../interfaces/menuHandlers'

export function useMenuCommands(h: MenuHandlers): (command: string) => void {
  return useCallback(
    (command: string) => {
      if (command.startsWith(C.configPrefix)) return h.config(command.slice(C.configPrefix.length))
      if (command.startsWith(C.exportPrefix)) return h.exportKey(command.slice(C.exportPrefix.length))
      const simple: Record<string, () => void> = {
        [C.clear]: h.clear,
        [C.crawls]: h.crawls,
        [C.schedule]: h.schedule,
        [C.exit]: h.exit,
        [C.modeSpider]: () => h.mode('spider'),
        [C.modeList]: () => h.mode('list'),
        [C.modeCompare]: () => h.mode('compare'),
        [C.analyse]: h.analyse,
        [C.themeLight]: () => h.theme('light'),
        [C.themeDark]: () => h.theme('dark'),
        [C.resetColumns]: h.resetColumns,
        [C.about]: h.about
      }
      simple[command]?.()
    },
    [h]
  )
}
